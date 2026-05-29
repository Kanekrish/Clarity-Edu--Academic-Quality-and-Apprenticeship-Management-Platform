const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/feedback — all feedback (with learner/mentor names)
router.get('/', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT f.*, l.name AS learner_name, l.student_id,
             u.name AS mentor_name
      FROM feedback f
      JOIN learners l ON l.id = f.learner_id
      LEFT JOIN users u ON u.id = f.mentor_id
      ORDER BY f.recorded_at DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feedback/learner/:learnerId
router.get('/learner/:learnerId', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT f.*, u.name AS mentor_name
      FROM feedback f
      LEFT JOIN users u ON u.id = f.mentor_id
      WHERE f.learner_id = ?
      ORDER BY f.recorded_at DESC
    `).all(req.params.learnerId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/feedback — submit feedback
router.post('/', auth, (req, res) => {
  const { learner_id, content, employer_priority } = req.body;
  if (!learner_id || !content) {
    return res.status(400).json({ error: 'learner_id and content are required' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO feedback (learner_id, mentor_id, content, employer_priority)
      VALUES (?, ?, ?, ?)
    `).run(learner_id, req.user.id, content, employer_priority || null);
    res.status(201).json({ message: 'Feedback recorded', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/feedback/:id
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM feedback WHERE id = ?').run(req.params.id);
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
