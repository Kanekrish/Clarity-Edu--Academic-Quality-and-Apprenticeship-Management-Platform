const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/dashboard/stats — returns stats relevant to the caller's role
router.get('/stats', auth, (req, res) => {
  try {
    const role = req.user.role;
    const stats = {};

    // Counts available to all roles
    stats.totalModules       = db.prepare('SELECT COUNT(*) AS n FROM modules').get().n;
    stats.totalLearners      = db.prepare('SELECT COUNT(*) AS n FROM learners').get().n;
    stats.atRiskLearners     = db.prepare('SELECT COUNT(DISTINCT learner_id) AS n FROM enrolments WHERE at_risk = 1').get().n;
    stats.pendingGrades      = db.prepare("SELECT COUNT(*) AS n FROM enrolments WHERE grade_status = 'pending'").get().n;
    stats.totalEvidence      = db.prepare('SELECT COUNT(*) AS n FROM evidence').get().n;
    stats.totalFeedback      = db.prepare('SELECT COUNT(*) AS n FROM feedback').get().n;
    stats.totalAssessments   = db.prepare('SELECT COUNT(*) AS n FROM assessments').get().n;
    stats.overdueAssessments = db.prepare(
      "SELECT COUNT(*) AS n FROM assessments WHERE marking_status IN ('overdue','not_started') AND deadline < date('now')"
    ).get().n;

    // Pass rate — two simple queries instead of one complex one
    const totalGraded = db.prepare(
      "SELECT COUNT(*) AS n FROM enrolments WHERE grade IS NOT NULL AND grade != ''"
    ).get().n;
    const totalPassed = db.prepare(
      "SELECT COUNT(*) AS n FROM enrolments WHERE grade IS NOT NULL AND grade != '' AND CAST(grade AS FLOAT) >= 40"
    ).get().n;
    stats.passRate = totalGraded > 0 ? Math.round((totalPassed / totalGraded) * 100) : null;

    // Admin: user breakdown
    if (role === 'system_admin') {
      stats.usersByRole = db.prepare(
        'SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY count DESC'
      ).all();
      stats.totalUsers  = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
      stats.recentUsers = db.prepare(
        'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
      ).all();
    }

    // At-risk learner list
    if (['academic_staff', 'coach', 'programme_lead'].includes(role)) {
      stats.atRiskList = db.prepare(`
        SELECT l.name, l.student_id, m.title AS module, e.grade
        FROM enrolments e
        JOIN learners l ON l.id = e.learner_id
        JOIN modules m  ON m.id = e.module_id
        WHERE e.at_risk = 1
        ORDER BY l.name
        LIMIT 10
      `).all();
    }

    // Today's and upcoming sessions for academic staff
    if (role === 'academic_staff') {
      stats.todaysSessions = db.prepare(`
        SELECT s.*, m.code AS module_code, m.title AS module_title
        FROM schedules s
        JOIN modules m ON m.id = s.module_id
        WHERE s.session_date = date('now')
        ORDER BY s.week_number
      `).all();
      stats.upcomingSessions = db.prepare(`
        SELECT s.*, m.code AS module_code, m.title AS module_title
        FROM schedules s
        JOIN modules m ON m.id = s.module_id
        WHERE s.session_date >= date('now')
        ORDER BY s.session_date
        LIMIT 5
      `).all();
    }

    // Coach: learner list and recent feedback
    if (role === 'coach') {
      stats.learners = db.prepare(`
        SELECT l.id, l.student_id, l.name, l.email,
               e2.name AS employer_name,
               COUNT(en.id) AS total_modules,
               MAX(en.at_risk) AS at_risk
        FROM learners l
        LEFT JOIN employers e2 ON e2.id = l.employer_id
        LEFT JOIN enrolments en ON en.learner_id = l.id
        GROUP BY l.id
        ORDER BY l.name
        LIMIT 10
      `).all();

      // Calculate graded_modules separately and merge in JS
      const gradedCounts = db.prepare(
        "SELECT learner_id, COUNT(*) AS graded_modules FROM enrolments WHERE grade_status = 'graded' GROUP BY learner_id"
      ).all();
      const gradedMap = {};
      for (const row of gradedCounts) {
        gradedMap[row.learner_id] = row.graded_modules;
      }
      stats.learners = stats.learners.map(l => ({
        ...l,
        graded_modules: gradedMap[l.id] || 0,
      }));

      stats.recentFeedback = db.prepare(`
        SELECT f.content, f.recorded_at, l.name AS learner_name
        FROM feedback f
        JOIN learners l ON l.id = f.learner_id
        ORDER BY f.recorded_at DESC
        LIMIT 5
      `).all();
    }

    // Employer: their linked learners and feedback
    if (role === 'employer') {
      stats.learners = db.prepare(`
        SELECT DISTINCT l.id, l.name, l.student_id,
          COUNT(en.id) AS total_modules
        FROM learners l
        LEFT JOIN enrolments en ON en.learner_id = l.id
        LEFT JOIN feedback f ON f.learner_id = l.id AND f.mentor_id = ?
        GROUP BY l.id
        ORDER BY l.name
        LIMIT 10
      `).all(req.user.id);
      stats.recentFeedback = db.prepare(`
        SELECT f.content, f.employer_priority, f.recorded_at, l.name AS learner_name
        FROM feedback f
        JOIN learners l ON l.id = f.learner_id
        WHERE f.mentor_id = ?
        ORDER BY f.recorded_at DESC
        LIMIT 5
      `).all(req.user.id);
    }

    // Ofsted / programme lead: evidence overview
    if (['ofsted_inspector', 'programme_lead'].includes(role)) {
      stats.evidenceByCategory = db.prepare(
        'SELECT category, COUNT(*) AS count FROM evidence GROUP BY category ORDER BY count DESC'
      ).all();
      stats.recentEvidence = db.prepare(`
        SELECT e.*, u.name AS uploaded_by_name
        FROM evidence e
        LEFT JOIN users u ON u.id = e.uploaded_by
        ORDER BY e.uploaded_at DESC
        LIMIT 10
      `).all();
    }

    // Programme lead: module overview
    if (role === 'programme_lead') {
      const modules = db.prepare('SELECT id, code, title FROM modules ORDER BY code').all();
      const learnerCounts = db.prepare(
        'SELECT module_id, COUNT(DISTINCT learner_id) AS count FROM enrolments GROUP BY module_id'
      ).all();
      const assessmentCounts = db.prepare(
        'SELECT module_id, COUNT(*) AS count FROM assessments GROUP BY module_id'
      ).all();
      const atRiskCounts = db.prepare(
        'SELECT module_id, COUNT(*) AS count FROM enrolments WHERE at_risk = 1 GROUP BY module_id'
      ).all();

      // Build lookup maps
      const learnerMap    = {};
      const assessmentMap = {};
      const atRiskMap     = {};
      for (const r of learnerCounts)    learnerMap[r.module_id]    = r.count;
      for (const r of assessmentCounts) assessmentMap[r.module_id] = r.count;
      for (const r of atRiskCounts)     atRiskMap[r.module_id]     = r.count;

      stats.moduleOverview = modules.map(m => ({
        id:               m.id,
        code:             m.code,
        title:            m.title,
        learner_count:    learnerMap[m.id]    || 0,
        assessment_count: assessmentMap[m.id] || 0,
        at_risk_count:    atRiskMap[m.id]     || 0,
      }));
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/programme-leader — full data pack for Programme Leader pages
router.get('/programme-leader', auth, (_req, res) => {
  try {
    // Basic KPIs
    const totalLearners  = db.prepare('SELECT COUNT(*) AS n FROM learners').get().n;
    const atRiskLearners = db.prepare('SELECT COUNT(DISTINCT learner_id) AS n FROM enrolments WHERE at_risk = 1').get().n;

    const totalGraded = db.prepare(
      "SELECT COUNT(*) AS n FROM enrolments WHERE grade IS NOT NULL AND grade != ''"
    ).get().n;
    const totalPassed = db.prepare(
      "SELECT COUNT(*) AS n FROM enrolments WHERE grade IS NOT NULL AND grade != '' AND CAST(grade AS FLOAT) >= 40"
    ).get().n;
    const passRate  = totalGraded > 0 ? Math.round((totalPassed / totalGraded) * 100) : null;
    const retention = totalLearners > 0 ? Math.round(((totalLearners - atRiskLearners) / totalLearners) * 100) : null;

    // Learner breakdown by module level — fetch raw data and group in JS
    const enrolmentRows = db.prepare(`
      SELECT en.at_risk, m.level
      FROM enrolments en
      JOIN modules m ON m.id = en.module_id
    `).all();

    const breakdownMap = {};
    for (const row of enrolmentRows) {
      const level = row.level || 'Other';
      if (!breakdownMap[level]) breakdownMap[level] = { level, on_track: 0, at_risk: 0, total: 0 };
      breakdownMap[level].total++;
      if (row.at_risk) {
        breakdownMap[level].at_risk++;
      } else {
        breakdownMap[level].on_track++;
      }
    }
    const learnerBreakdown = Object.values(breakdownMap).sort((a, b) => a.level - b.level);

    // Module stats — separate queries then merge in JS
    const modules = db.prepare('SELECT id, code, title, level, credits FROM modules ORDER BY code').all();

    const learnerCounts = db.prepare(
      'SELECT module_id, COUNT(DISTINCT learner_id) AS count FROM enrolments GROUP BY module_id'
    ).all();
    const assessmentCounts = db.prepare(
      'SELECT module_id, COUNT(*) AS count FROM assessments GROUP BY module_id'
    ).all();
    const atRiskCounts = db.prepare(
      'SELECT module_id, COUNT(*) AS count FROM enrolments WHERE at_risk = 1 GROUP BY module_id'
    ).all();
    const gradeRows = db.prepare(
      "SELECT module_id, CAST(grade AS FLOAT) AS grade FROM enrolments WHERE grade IS NOT NULL AND grade != ''"
    ).all();

    const learnerMap    = {};
    const assessmentMap = {};
    const atRiskMap     = {};
    const gradesMap     = {};
    for (const r of learnerCounts)    learnerMap[r.module_id]    = r.count;
    for (const r of assessmentCounts) assessmentMap[r.module_id] = r.count;
    for (const r of atRiskCounts)     atRiskMap[r.module_id]     = r.count;
    for (const r of gradeRows) {
      if (!gradesMap[r.module_id]) gradesMap[r.module_id] = [];
      gradesMap[r.module_id].push(r.grade);
    }

    const moduleStats = modules.map(m => {
      const grades = gradesMap[m.id] || [];
      const avg_grade = grades.length > 0
        ? Math.round((grades.reduce((sum, g) => sum + g, 0) / grades.length) * 10) / 10
        : null;
      return {
        id:               m.id,
        code:             m.code,
        title:            m.title,
        level:            m.level,
        learner_count:    learnerMap[m.id]    || 0,
        assessment_count: assessmentMap[m.id] || 0,
        at_risk_count:    atRiskMap[m.id]     || 0,
        avg_grade,
      };
    });

    // Staff list
    const staffList = db.prepare(`
      SELECT u.id, u.name, u.role, u.email,
        COUNT(DISTINCT a.id) AS assessment_count
      FROM users u
      LEFT JOIN assessments a ON a.module_id IN (SELECT id FROM modules)
      WHERE u.role IN ('academic_staff', 'programme_lead', 'coach')
      GROUP BY u.id
      ORDER BY u.name
    `).all();

    // Feedback grouped by mentor role
    const feedbackByRole = db.prepare(`
      SELECT u.role AS category, COUNT(*) AS count
      FROM feedback f
      LEFT JOIN users u ON u.id = f.mentor_id
      GROUP BY u.role
      ORDER BY count DESC
    `).all();

    const recentFeedback = db.prepare(`
      SELECT f.content, f.employer_priority, f.recorded_at,
             l.name AS learner_name, u.name AS mentor_name, u.role AS mentor_role
      FROM feedback f
      JOIN learners l ON l.id = f.learner_id
      LEFT JOIN users u ON u.id = f.mentor_id
      ORDER BY f.recorded_at DESC
      LIMIT 10
    `).all();

    // Resource counts
    const resourceCounts = {
      modules:     db.prepare('SELECT COUNT(*) AS n FROM modules').get().n,
      assessments: db.prepare('SELECT COUNT(*) AS n FROM assessments').get().n,
      ksbMappings: db.prepare('SELECT COUNT(*) AS n FROM ksb_mappings').get().n,
      evidence:    db.prepare('SELECT COUNT(*) AS n FROM evidence').get().n,
      learners:    totalLearners,
    };

    const evidenceByCategory = db.prepare(
      'SELECT category, COUNT(*) AS count FROM evidence GROUP BY category ORDER BY count DESC'
    ).all();

    const overdueAssessments = db.prepare(
      "SELECT COUNT(*) AS n FROM assessments WHERE marking_status IN ('overdue','not_started') AND deadline < date('now')"
    ).get().n;

    const totalAssessments  = db.prepare('SELECT COUNT(*) AS n FROM assessments').get().n;
    const gradedAssessments = db.prepare("SELECT COUNT(*) AS n FROM assessments WHERE marking_status = 'marked'").get().n;
    const assessmentCompletionRate = totalAssessments > 0
      ? Math.round((gradedAssessments / totalAssessments) * 100)
      : null;

    res.json({
      kpis: { totalLearners, passRate, atRiskLearners, retention },
      learnerBreakdown,
      moduleStats,
      staffList,
      feedbackByRole,
      recentFeedback,
      resourceCounts,
      evidenceByCategory,
      overdueAssessments,
      assessmentCompletionRate,
      totalAssessments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/coach-progress — learner progress data for the coach view
router.get('/coach-progress', auth, (_req, res) => {
  try {
    const learners = db.prepare(`
      SELECT l.id, l.name, l.student_id,
        e.name AS employer_name,
        COUNT(en.id) AS total_modules,
        MAX(en.at_risk) AS at_risk
      FROM learners l
      LEFT JOIN employers e ON e.id = l.employer_id
      LEFT JOIN enrolments en ON en.learner_id = l.id
      GROUP BY l.id
      ORDER BY l.name
    `).all();

    // Get graded module counts separately
    const gradedCounts = db.prepare(
      "SELECT learner_id, COUNT(*) AS count FROM enrolments WHERE grade_status = 'graded' GROUP BY learner_id"
    ).all();
    const gradedMap = {};
    for (const row of gradedCounts) {
      gradedMap[row.learner_id] = row.count;
    }

    const enrolmentStmt = db.prepare(`
      SELECT en.grade_status, en.grade, en.at_risk,
             m.id AS module_id, m.code AS module_code, m.title AS module_title
      FROM enrolments en
      JOIN modules m ON m.id = en.module_id
      WHERE en.learner_id = ?
      ORDER BY m.code
    `);

    const ksbStmt = db.prepare(
      'SELECT ksb_code, description FROM ksb_mappings WHERE module_id = ? ORDER BY ksb_code'
    );

    const result = learners.map(learner => {
      const graded_modules = gradedMap[learner.id] || 0;
      const enrolments     = enrolmentStmt.all(learner.id);

      // Build a flat list of KSB items for this learner
      const ksbItems = [];
      for (const en of enrolments) {
        const ksbs = ksbStmt.all(en.module_id);
        for (const k of ksbs) {
          let status = 'Not Started';
          if (en.grade_status === 'graded')  status = 'Complete';
          if (en.grade_status === 'pending') status = 'In Progress';
          ksbItems.push({ code: k.ksb_code, description: k.description, status, module: en.module_code });
        }
      }

      // Fall back to enrolments if no KSB mappings exist
      const items = ksbItems.length > 0 ? ksbItems : enrolments.map(en => {
        let status = 'Not Started';
        if (en.grade_status === 'graded')  status = 'Complete';
        if (en.grade_status === 'pending') status = 'In Progress';
        return { code: en.module_code, description: en.module_title, status, module: en.module_code };
      });

      // Overall progress as a percentage
      const completeCount = items.filter(i => i.status === 'Complete').length;
      const overallProgress = items.length > 0
        ? Math.round((completeCount / items.length) * 100)
        : learner.total_modules > 0 ? Math.round((graded_modules / learner.total_modules) * 100) : 0;

      // K / S / B percentages
      const calcPercent = (prefix) => {
        const subset = items.filter(i => i.code.toUpperCase().startsWith(prefix));
        if (subset.length === 0) return null;
        const done = subset.filter(i => i.status === 'Complete').length;
        return Math.round((done / subset.length) * 100);
      };

      return {
        ...learner,
        graded_modules,
        overallProgress,
        knowledge:  calcPercent('K'),
        skills:     calcPercent('S'),
        behaviours: calcPercent('B'),
        items,
      };
    });

    // Programme-level averages using simple loops
    let totalProgress = 0;
    let kTotal = 0, kCount = 0;
    let sTotal = 0, sCount = 0;
    let bTotal = 0, bCount = 0;

    for (const l of result) {
      totalProgress += l.overallProgress;
      if (l.knowledge  !== null) { kTotal += l.knowledge;  kCount++; }
      if (l.skills     !== null) { sTotal += l.skills;     sCount++; }
      if (l.behaviours !== null) { bTotal += l.behaviours; bCount++; }
    }

    res.json({
      learners: result,
      summary: {
        totalLearners: result.length,
        onTrack:       result.filter(l => !l.at_risk).length,
        needSupport:   result.filter(l =>  l.at_risk).length,
        avgProgress:   result.length > 0 ? Math.round(totalProgress / result.length) : 0,
        avgKnowledge:  kCount > 0 ? Math.round(kTotal / kCount) : null,
        avgSkills:     sCount > 0 ? Math.round(sTotal / sCount) : null,
        avgBehaviours: bCount > 0 ? Math.round(bTotal / bCount) : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
