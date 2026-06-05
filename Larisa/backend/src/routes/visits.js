const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/visits — all visits for the logged-in user with learner name
router.get('/', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT v.*, l.name AS learner_name, l.student_id
      FROM visits v
      JOIN learners l ON l.id = v.learner_id
      WHERE v.mentor_id = ?
      ORDER BY v.visit_date DESC, v.visit_time DESC
    `).all(req.user.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/visits — schedule a new visit
router.post('/', auth, (req, res) => {
  const { learner_id, visit_date, visit_time, location, purpose, attendees } = req.body;
  if (!learner_id || !visit_date) {
    return res.status(400).json({ error: 'learner_id and visit_date are required' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO visits (learner_id, mentor_id, visit_date, visit_time, location, purpose, attendees, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Scheduled')
    `).run(learner_id, req.user.id, visit_date, visit_time || null, location || null, purpose || null, attendees || null);
    res.status(201).json({ message: 'Visit scheduled', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/visits/:id — update status or feedback
router.patch('/:id', auth, (req, res) => {
  const { status, feedback_notes } = req.body;
  try {
    db.prepare(`
      UPDATE visits SET status = COALESCE(?, status), feedback_notes = COALESCE(?, feedback_notes)
      WHERE id = ? AND mentor_id = ?
    `).run(status || null, feedback_notes || null, req.params.id, req.user.id);
    res.json({ message: 'Visit updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/visits/:id
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM visits WHERE id = ? AND mentor_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Visit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
