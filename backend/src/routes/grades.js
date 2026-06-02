const express = require('express');
const multer = require('multer');
const fs = require('fs');
const db = require('../db/database');
const auth = require('../middleware/auth');
const { parseGradeFile } = require('../services/gradeProcessor');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// POST - upload and process grade file
router.post('/import', auth, upload.single('gradeFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const rows = await parseGradeFile(req.file.path, req.file.originalname);
    const errors = [];
    const inserted = [];

    const upsert = db.prepare(`
      INSERT INTO enrolments (learner_id, module_id, grade, grade_status, at_risk)
      VALUES (?, ?, ?, 'graded', ?)
      ON CONFLICT(learner_id, module_id) DO UPDATE SET
        grade = excluded.grade,
        grade_status = 'graded',
        at_risk = excluded.at_risk
    `);

    const processAll = db.transaction(() => {
      for (const row of rows) {
        if (!row.student_id && !row.module_code) continue; // skip blank rows

        const learner = db.prepare(
          'SELECT id FROM learners WHERE student_id = ?'
        ).get(row.student_id);

        const module = db.prepare(
          'SELECT id FROM modules WHERE code = ?'
        ).get(row.module_code);

        if (!learner || !module) {
          errors.push({ row, reason: 'Student or module not found' });
          continue;
        }

        // Flag at-risk if grade below 40 or missing
        const gradeNum = parseFloat(row.grade);
        const atRisk = isNaN(gradeNum) || gradeNum < 40 ? 1 : 0;

        upsert.run(learner.id, module.id, row.grade, atRisk);
        inserted.push(row);
      }
    });

    processAll();

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json({
      message: '✅ Grades imported',
      imported: inserted.length,
      errors
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - student overview for a module
router.get('/overview/:moduleId', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT l.student_id, l.name, e.grade, e.grade_status, e.at_risk
      FROM enrolments e
      JOIN learners l ON l.id = e.learner_id
      WHERE e.module_id = ?
      ORDER BY l.name
    `).all(req.params.moduleId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - all at-risk learners
router.get('/at-risk', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT l.name, l.student_id, m.title as module, e.grade
      FROM enrolments e
      JOIN learners l ON l.id = e.learner_id
      JOIN modules m ON m.id = e.module_id
      WHERE e.at_risk = 1
      ORDER BY l.name
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;