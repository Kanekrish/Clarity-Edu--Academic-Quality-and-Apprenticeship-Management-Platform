const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/sessions — all sessions for the logged-in coach (with learner name)
router.get('/', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT s.*, l.name AS learner_name, l.student_id
      FROM sessions s
      JOIN learners l ON l.id = s.learner_id
      WHERE s.coach_id = ?
      ORDER BY s.session_date DESC, s.session_time DESC
    `).all(req.user.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions — schedule a new session
router.post('/', auth, (req, res) => {
  const { learner_id, session_date, session_time, session_type, notes } = req.body;
  if (!learner_id || !session_date) {
    return res.status(400).json({ error: 'learner_id and session_date are required' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO sessions (learner_id, coach_id, session_date, session_time, session_type, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(learner_id, req.user.id, session_date, session_time || null, session_type || 'Progress Review', notes || null);
    res.status(201).json({ message: 'Session scheduled', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sessions/:id — update status or notes
router.patch('/:id', auth, (req, res) => {
  const { status, notes } = req.body;
  try {
    db.prepare(`
      UPDATE sessions SET status = COALESCE(?, status), notes = COALESCE(?, notes)
      WHERE id = ? AND coach_id = ?
    `).run(status || null, notes || null, req.params.id, req.user.id);
    res.json({ message: 'Session updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/:id
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM sessions WHERE id = ? AND coach_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Session cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
