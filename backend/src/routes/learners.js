const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/learners — all learners with employer name and progress
router.get('/', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        l.id, l.student_id, l.name, l.email, l.enrolled_at,
        e.name AS employer_name,
        COUNT(en.id) AS total_modules,
        SUM(CASE WHEN en.grade_status = 'graded' THEN 1 ELSE 0 END) AS graded_modules,
        MAX(en.at_risk) AS at_risk
      FROM learners l
      LEFT JOIN employers e ON e.id = l.employer_id
      LEFT JOIN enrolments en ON en.learner_id = l.id
      GROUP BY l.id
      ORDER BY l.name
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/learners/:id — single learner with their enrolments
router.get('/:id', auth, (req, res) => {
  try {
    const learner = db.prepare(`
      SELECT l.*, e.name AS employer_name
      FROM learners l
      LEFT JOIN employers e ON e.id = l.employer_id
      WHERE l.id = ?
    `).get(req.params.id);
    if (!learner) return res.status(404).json({ error: 'Learner not found' });

    const enrolments = db.prepare(`
      SELECT m.code, m.title, en.grade, en.grade_status, en.at_risk
      FROM enrolments en
      JOIN modules m ON m.id = en.module_id
      WHERE en.learner_id = ?
    `).all(req.params.id);

    res.json({ ...learner, enrolments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/learners — create learner
router.post('/', auth, (req, res) => {
  const { student_id, name, email, employer_id, enrolled_at } = req.body;
  if (!student_id || !name) return res.status(400).json({ error: 'student_id and name are required' });
  try {
    const result = db.prepare(`
      INSERT INTO learners (student_id, name, email, employer_id, enrolled_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(student_id, name, email || null, employer_id || null, enrolled_at || new Date().toISOString().split('T')[0]);
    res.status(201).json({ message: 'Learner created', id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Student ID already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/learners/:id — update learner
router.put('/:id', auth, (req, res) => {
  const { name, email, employer_id, enrolled_at } = req.body;
  try {
    db.prepare(`
      UPDATE learners SET name = ?, email = ?, employer_id = ?, enrolled_at = ? WHERE id = ?
    `).run(name, email || null, employer_id || null, enrolled_at || null, req.params.id);
    res.json({ message: 'Learner updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/learners/:id
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM learners WHERE id = ?').run(req.params.id);
    res.json({ message: 'Learner deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
