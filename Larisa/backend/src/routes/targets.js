const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/targets — all targets for the logged-in coach (with learner name)
router.get('/', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT t.*, l.name AS learner_name, l.student_id
      FROM targets t
      JOIN learners l ON l.id = t.learner_id
      WHERE t.coach_id = ?
      ORDER BY t.due_date ASC, t.created_at DESC
    `).all(req.user.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/targets — create a new target
router.post('/', auth, (req, res) => {
  const { learner_id, title, description, category, due_date } = req.body;
  if (!learner_id || !title) {
    return res.status(400).json({ error: 'learner_id and title are required' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO targets (coach_id, learner_id, title, description, category, due_date, progress, status)
      VALUES (?, ?, ?, ?, ?, ?, 0, 'On Track')
    `).run(req.user.id, learner_id, title, description || null, category || 'KSB', due_date || null);
    res.status(201).json({ message: 'Target created', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/targets/:id — update progress (auto-derives status)
router.patch('/:id', auth, (req, res) => {
  const { progress } = req.body;
  if (progress === undefined) return res.status(400).json({ error: 'progress is required' });
  const p = Math.max(0, Math.min(100, Number(progress)));
  const status = p === 100 ? 'Complete' : p < 50 ? 'At Risk' : 'On Track';
  try {
    db.prepare(`
      UPDATE targets SET progress = ?, status = ? WHERE id = ? AND coach_id = ?
    `).run(p, status, req.params.id, req.user.id);
    res.json({ message: 'Target updated', progress: p, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/targets/:id
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM targets WHERE id = ? AND coach_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Target deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
