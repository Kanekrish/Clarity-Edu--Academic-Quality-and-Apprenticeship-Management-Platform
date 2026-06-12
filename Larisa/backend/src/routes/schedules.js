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
  const {
    academicYear, semesterStart, semesterEnd,
    christmasStart, christmasEnd,
    easterStart, easterEnd,
    readingWeek1Start, readingWeek1End,
    readingWeek2Start, readingWeek2End,
  } = req.query;

  if (!semesterStart || !semesterEnd) {
    return res.status(400).json({ error: 'semesterStart and semesterEnd are required' });
  }

  try {
    const modules = db.prepare('SELECT * FROM modules ORDER BY level, code').all();
    const allSchedules = db.prepare(
      'SELECT * FROM schedules WHERE academic_year = ? ORDER BY module_id, week_number'
    ).all(academicYear || '');

    const sessionMap = {};
    for (const s of allSchedules) {
      if (!sessionMap[s.module_id]) sessionMap[s.module_id] = new Set();
      sessionMap[s.module_id].add(s.session_date);
    }

    const allAssessments = db.prepare(
      'SELECT module_id, deadline FROM assessments WHERE deadline IS NOT NULL'
    ).all();
    const assessmentMap = {};
    for (const a of allAssessments) {
      if (!assessmentMap[a.module_id]) assessmentMap[a.module_id] = [];
      assessmentMap[a.module_id].push(a.deadline);
    }
    const weekContainsDate = (weekStart, dateStr) => {
      const wStart = weekStart.toISOString().split('T')[0];
      const wEnd = new Date(new Date(wStart + 'T00:00:00Z').getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      return dateStr >= wStart && dateStr <= wEnd;
    };

    // Build weekly dates from semesterStart (no snap — must match scheduleEngine dates)
    const weeks = [];
    const cur = new Date(semesterStart);
    const endDate = new Date(semesterEnd);
    while (cur <= endDate) {
      weeks.push(new Date(cur));
      cur.setDate(cur.getDate() + 7);
    }

    const inPeriod = (date, start, end) => {
      if (!start || !end) return false;
      return date >= new Date(start) && date <= new Date(end);
    };

    const weekType = (d) => {
      if (inPeriod(d, christmasStart, christmasEnd)) return 'christmas';
      if (inPeriod(d, easterStart, easterEnd))       return 'easter';
      if (inPeriod(d, readingWeek1Start, readingWeek1End)) return 'reading';
      if (inPeriod(d, readingWeek2Start, readingWeek2End)) return 'reading';
      return null;
    };

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // ARGB colour constants
    const C_TEAL    = 'FF0F766E';
    const C_ORANGE  = 'FFFB923C';
    const C_GREEN   = 'FFBBF7D0';
    const C_YELLOW  = 'FFFEF08A';
    const C_PURPLE  = 'FFF3E8FF';
    const C_RED     = 'FFEF4444';
    const C_DARK    = 'FF1F2937';
    const C_DARKER  = 'FF111827';
    const C_ALT     = 'FFF9FAFB';
    const C_WHITE   = 'FFFFFFFF';
    const C_GRAY_TXT = 'FF374151';

    const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
    const thinBorder = { style: 'thin', color: { argb: 'FFCCCCCC' } };
    const border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    const FIXED = 3;
    const TOTAL_COLS = FIXED + weeks.length;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Schedule');
    let rowNum = 0;

    // Row 1 — Title
    rowNum++;
    const titleRow = sheet.addRow([`Cohort Academic Year ${academicYear || ''}`]);
    sheet.mergeCells(rowNum, 1, rowNum, TOTAL_COLS);
    titleRow.height = 28;
    const tc = titleRow.getCell(1);
    tc.fill = fill(C_TEAL);
    tc.font = { bold: true, color: { argb: C_WHITE }, size: 14 };
    tc.alignment = { horizontal: 'center', vertical: 'middle' };
    tc.border = border;

    // Build month groups
    const monthGroups = [];
    for (const w of weeks) {
      const label = `${MONTHS[w.getMonth()]} ${w.getFullYear()}`;
      const last = monthGroups[monthGroups.length - 1];
      if (last && last.label === label) last.count++;
      else monthGroups.push({ label, count: 1 });
    }

    // Row 2 — Month headers
    rowNum++;
    const monthRow = sheet.addRow(Array(TOTAL_COLS).fill(''));
    monthRow.height = 20;
    const monthFixedLabels = ['Module Code', 'Module Name', 'CATs'];
    for (let c = 1; c <= FIXED; c++) {
      const cell = monthRow.getCell(c);
      cell.value = monthFixedLabels[c - 1];
      cell.fill = fill(C_TEAL);
      cell.font = { bold: true, color: { argb: C_WHITE } };
      cell.alignment = { horizontal: c === 3 ? 'center' : 'left', vertical: 'middle' };
      cell.border = border;
    }
    let colCursor = FIXED + 1;
    for (const mg of monthGroups) {
      const endCol = colCursor + mg.count - 1;
      if (mg.count > 1) sheet.mergeCells(rowNum, colCursor, rowNum, endCol);
      const cell = monthRow.getCell(colCursor);
      cell.value = mg.label;
      cell.fill = fill(C_TEAL);
      cell.font = { bold: true, color: { argb: C_WHITE } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = border;
      colCursor += mg.count;
    }

    // Row 3 — Date headers (rotated)
    rowNum++;
    const dateRow = sheet.addRow(Array(TOTAL_COLS).fill(''));
    dateRow.height = 72;
    for (let c = 1; c <= FIXED; c++) {
      const cell = dateRow.getCell(c);
      cell.fill = fill(C_TEAL);
      cell.border = border;
    }
    weeks.forEach((w, i) => {
      const t = weekType(w);
      const dd = String(w.getDate()).padStart(2, '0');
      const mm = String(w.getMonth() + 1).padStart(2, '0');
      const yy = String(w.getFullYear()).slice(2);
      const cell = dateRow.getCell(FIXED + 1 + i);
      cell.value = `${dd}/${mm}/${yy}`;
      cell.fill = fill(t === 'christmas' ? C_GREEN : t === 'easter' ? C_YELLOW : t === 'reading' ? C_PURPLE : C_TEAL);
      cell.font = { color: { argb: t ? C_GRAY_TXT : C_WHITE }, size: 8 };
      cell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'bottom' };
      cell.border = border;
    });

    // Row 4 — Week numbers
    rowNum++;
    const wkRow = sheet.addRow(Array(TOTAL_COLS).fill(''));
    wkRow.height = 14;
    const wkFixedLabels = ['Occ', 'CATs', 'Board'];
    for (let c = 1; c <= FIXED; c++) {
      const cell = wkRow.getCell(c);
      cell.value = wkFixedLabels[c - 1];
      cell.fill = fill(C_TEAL);
      cell.font = { bold: true, color: { argb: C_WHITE }, size: 8 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = border;
    }
    weeks.forEach((w, i) => {
      const t = weekType(w);
      let label;
      if (t === 'christmas') label = 'Xmas';
      else if (t === 'easter') label = 'Easter';
      else if (t === 'reading') label = 'RW';
      else label = String(i + 1);
      const cell = wkRow.getCell(FIXED + 1 + i);
      cell.value = label;
      cell.fill = fill(t === 'christmas' ? C_GREEN : t === 'easter' ? C_YELLOW : t === 'reading' ? C_PURPLE : C_TEAL);
      cell.font = { bold: !!t, color: { argb: t ? C_GRAY_TXT : C_WHITE }, size: 8 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = border;
    });

    // Row 5 — Banner
    rowNum++;
    const bannerRow = sheet.addRow(['Cohorts          DAB and Progression Boards']);
    sheet.mergeCells(rowNum, 1, rowNum, TOTAL_COLS);
    bannerRow.height = 16;
    const bc = bannerRow.getCell(1);
    bc.fill = fill(C_DARKER);
    bc.font = { bold: true, color: { argb: C_WHITE }, size: 10 };
    bc.alignment = { horizontal: 'left', vertical: 'middle' };
    bc.border = border;

    // Group modules by level
    const levelMap = {};
    for (const m of modules) {
      const k = m.level != null ? String(m.level) : 'Other';
      if (!levelMap[k]) levelMap[k] = [];
      levelMap[k].push(m);
    }
    const levelGroups = Object.entries(levelMap).sort(([a], [b]) => {
      if (a === 'Other' && b !== 'Other') return 1;
      if (b === 'Other' && a !== 'Other') return -1;
      return parseInt(a) - parseInt(b);
    });

    for (const [level, mods] of levelGroups) {
      // Level group header
      rowNum++;
      const lvlRow = sheet.addRow([level === 'Other' ? 'Modules' : `Level ${level} Modules`]);
      sheet.mergeCells(rowNum, 1, rowNum, TOTAL_COLS);
      lvlRow.height = 16;
      const lc = lvlRow.getCell(1);
      lc.fill = fill(C_DARK);
      lc.font = { bold: true, color: { argb: C_WHITE }, size: 10 };
      lc.alignment = { horizontal: 'left', vertical: 'middle' };
      lc.border = border;

      mods.forEach((m, mi) => {
        rowNum++;
        const sessions = sessionMap[m.id] || new Set();
        const isAlt = mi % 2 === 1;
        const rowBg = isAlt ? C_ALT : C_WHITE;

        const modRow = sheet.addRow(Array(TOTAL_COLS).fill(''));
        modRow.height = 14;

        modRow.getCell(1).value = m.code;
        modRow.getCell(1).fill = fill(rowBg);
        modRow.getCell(1).font = { bold: true, size: 9 };
        modRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        modRow.getCell(1).border = border;

        modRow.getCell(2).value = m.title;
        modRow.getCell(2).fill = fill(rowBg);
        modRow.getCell(2).font = { size: 9 };
        modRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
        modRow.getCell(2).border = border;

        modRow.getCell(3).value = m.credits ?? '';
        modRow.getCell(3).fill = fill(rowBg);
        modRow.getCell(3).font = { size: 9 };
        modRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        modRow.getCell(3).border = border;

        weeks.forEach((w, i) => {
          const dateStr = w.toISOString().split('T')[0];
          const t = weekType(w);
          const hasSession = sessions.has(dateStr);
          const hasAssessment = (assessmentMap[m.id] || []).some(d => weekContainsDate(w, d));
          let cellBg;
          if (t === 'christmas')      cellBg = C_GREEN;
          else if (t === 'easter')    cellBg = C_YELLOW;
          else if (t === 'reading')   cellBg = C_PURPLE;
          else if (hasAssessment)     cellBg = C_RED;
          else if (hasSession)        cellBg = C_ORANGE;
          else                        cellBg = rowBg;
          const cell = modRow.getCell(FIXED + 1 + i);
          cell.fill = fill(cellBg);
          cell.border = border;
        });
      });
    }

    // Empty spacer row between schedule and legend
    rowNum++;
    sheet.addRow([]);

    // Keys legend — single horizontal row
    rowNum++;
    const legendRow = sheet.addRow(Array(TOTAL_COLS).fill(''));
    legendRow.height = 18;

    legendRow.getCell(1).value = 'Keys';
    legendRow.getCell(1).font = { bold: true, size: 9 };
    legendRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

    const keyItems = [
      { label: 'Teaching Session',    bg: C_ORANGE },
      { label: 'Assessment Deadline', bg: C_RED    },
      { label: 'Christmas Break',     bg: C_GREEN  },
      { label: 'Easter Break',        bg: C_YELLOW },
      { label: 'Reading Week',        bg: C_PURPLE },
    ];

    // Each item spans 5 date-width columns (5 × 4 = 20 pts), starting after the 3 fixed columns
    const ITEM_SPAN = 5;
    keyItems.forEach((key, i) => {
      const colStart = FIXED + 1 + i * ITEM_SPAN;
      const colEnd   = colStart + ITEM_SPAN - 1;
      sheet.mergeCells(rowNum, colStart, rowNum, colEnd);
      const cell = legendRow.getCell(colStart);
      cell.value = key.label;
      cell.fill  = fill(key.bg);
      cell.font  = { size: 8 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = border;
    });

    // Column widths — extend to cover the legend which may span beyond TOTAL_COLS
    const legendEndCol = FIXED + 1 + keyItems.length * ITEM_SPAN - 1;
    sheet.getColumn(1).width = 14;
    sheet.getColumn(2).width = 35;
    sheet.getColumn(3).width = 6;
    for (let i = 4; i <= Math.max(TOTAL_COLS, legendEndCol); i++) {
      sheet.getColumn(i).width = 4;
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
