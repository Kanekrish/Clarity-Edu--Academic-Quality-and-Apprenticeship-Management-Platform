const express = require('express');
const ExcelJS = require('exceljs');
const db = require('../db/database');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { generateSchedule } = require('../services/scheduleEngine');
const router = express.Router();

// POST - generate and save schedule (single module or all modules)
router.post('/generate', auth, rbac('programme_lead', 'academic_staff'), (req, res) => {
  try {
    const { moduleId, academicYear } = req.body;

    // Resolve which module IDs to generate for
    let moduleIds;
    if (moduleId === 'all') {
      moduleIds = db.prepare('SELECT id FROM modules ORDER BY id').all().map(r => r.id);
    } else {
      moduleIds = [moduleId];
    }

    if (moduleIds.length === 0) {
      return res.status(400).json({ error: 'No modules found in the database' });
    }

    const deleteStmt = db.prepare(
      'DELETE FROM schedules WHERE module_id = ? AND academic_year = ?'
    );
    const insert = db.prepare(`
      INSERT INTO schedules (academic_year, module_id, week_number, session_date, topic)
      VALUES (?, ?, ?, ?, ?)
    `);

    let totalCount = 0;
    const run = db.transaction(() => {
      for (const mid of moduleIds) {
        // Delete existing sessions for this module + year (fresh rebuild)
        deleteStmt.run(mid, academicYear || req.body.academicYear);

        const sessions = generateSchedule({ ...req.body, moduleId: mid });
        for (const s of sessions) {
          insert.run(s.academic_year, s.module_id, s.week_number, s.session_date, s.topic);
        }
        totalCount += sessions.length;
      }
    });

    run();

    res.json({
      message: moduleId === 'all'
        ? ` Schedule generated for all ${moduleIds.length} modules`
        : ' Schedule generated',
      count: totalCount,
      moduleCount: moduleIds.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /clear — wipe all schedules for a given academicYear (or a single module)
router.delete('/clear', auth, rbac('programme_lead', 'academic_staff'), (req, res) => {
  try {
    const { academicYear, moduleId } = req.query;
    if (!academicYear) return res.status(400).json({ error: 'academicYear is required' });
    let info;
    if (moduleId && moduleId !== 'all') {
      info = db.prepare('DELETE FROM schedules WHERE academic_year = ? AND module_id = ?').run(academicYear, moduleId);
    } else {
      info = db.prepare('DELETE FROM schedules WHERE academic_year = ?').run(academicYear);
    }
    res.json({ message: `Cleared ${info.changes} sessions`, changes: info.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / — all schedules for a given academicYear (must be before /:moduleId)
router.get('/', auth, (req, res) => {
  try {
    const { academicYear } = req.query;
    const rows = academicYear
      ? db.prepare('SELECT * FROM schedules WHERE academic_year = ? ORDER BY module_id, week_number').all(academicYear)
      : db.prepare('SELECT * FROM schedules ORDER BY academic_year, module_id, week_number').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /export-gantt — Gantt-style Excel export for all modules
// MUST be before /:moduleId to avoid wildcard match
router.get('/export-gantt', auth, async (req, res) => {
  const { academicYear, semesterStart, semesterEnd } = req.query;

  if (!semesterStart || !semesterEnd) {
    return res.status(400).json({ error: 'semesterStart and semesterEnd are required' });
  }

  try {
    const modules = db.prepare('SELECT * FROM modules ORDER BY level, code').all();
    const allSchedules = db.prepare(
      'SELECT * FROM schedules WHERE academic_year = ? ORDER BY module_id, week_number'
    ).all(academicYear || '');

    // Build a map of moduleId -> set of session dates
    const sessionMap = {};
    for (const s of allSchedules) {
      if (!sessionMap[s.module_id]) sessionMap[s.module_id] = new Set();
      sessionMap[s.module_id].add(s.session_date);
    }

    // Build a list of weekly dates from start to end
    const weeks = [];
    const current = new Date(semesterStart);
    const endDate = new Date(semesterEnd);
    while (current <= endDate) {
      weeks.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Schedule');

    // Header row: fixed columns + one column per week
    const headers = ['Module Code', 'Module Name', 'Credits'];
    for (const week of weeks) {
      const day = String(week.getDate()).padStart(2, '0');
      const month = String(week.getMonth() + 1).padStart(2, '0');
      headers.push(`${day}/${month}`);
    }

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };

    // One row per module — mark sessions with X
    for (const m of modules) {
      const sessions = sessionMap[m.id] || new Set();
      const row = [m.code, m.title, m.credits ?? ''];

      for (const week of weeks) {
        const dateStr = week.toISOString().split('T')[0];
        row.push(sessions.has(dateStr) ? 'X' : '');
      }

      sheet.addRow(row);
    }

    // Set column widths
    sheet.getColumn(1).width = 14;
    sheet.getColumn(2).width = 40;
    sheet.getColumn(3).width = 10;
    for (let i = 4; i <= headers.length; i++) {
      sheet.getColumn(i).width = 8;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Schedule_${(academicYear || 'export').replace(/\//g, '-')}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - get schedule for a module
router.get('/:moduleId', auth, (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM schedules WHERE module_id = ? ORDER BY week_number'
    ).all(req.params.moduleId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - export schedule as Excel (single module, simple)
router.get('/export/:moduleId', auth, async (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM schedules WHERE module_id = ? ORDER BY week_number'
    ).all(req.params.moduleId);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Module Delivery Schedule');

    sheet.columns = [
      { header: 'Week', key: 'week_number', width: 8 },
      { header: 'Date', key: 'session_date', width: 15 },
      { header: 'Topic', key: 'topic', width: 40 },
    ];

    rows.forEach(row => sheet.addRow(row));

    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',
      'attachment; filename=ModuleDeliverySchedule.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
