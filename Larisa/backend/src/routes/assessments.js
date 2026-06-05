const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/assessments — all assessments with module info
router.get('/', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT a.*, m.code AS module_code, m.title AS module_title
      FROM assessments a
      JOIN modules m ON m.id = a.module_id
      ORDER BY a.deadline ASC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assessments/module/:moduleId
router.get('/module/:moduleId', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT a.*, m.code AS module_code, m.title AS module_title
      FROM assessments a
      JOIN modules m ON m.id = a.module_id
      WHERE a.module_id = ?
      ORDER BY a.deadline ASC
    `).all(req.params.moduleId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assessments
router.post('/', auth, (req, res) => {
  const { module_id, title, release_date, deadline, marking_status, review_date, external_examiner_required } = req.body;
  if (!module_id || !title) return res.status(400).json({ error: 'module_id and title are required' });
  try {
    const result = db.prepare(`
      INSERT INTO assessments (module_id, title, release_date, deadline, marking_status, review_date, external_examiner_required)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      module_id, title,
      release_date || null, deadline || null,
      marking_status || 'not_started',
      review_date || null,
      external_examiner_required ? 1 : 0
    );
    res.status(201).json({ message: 'Assessment created', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/assessments/:id
router.put('/:id', auth, (req, res) => {
  const { title, release_date, deadline, marking_status, review_date, external_examiner_required } = req.body;
  try {
    db.prepare(`
      UPDATE assessments
      SET title = ?, release_date = ?, deadline = ?, marking_status = ?, review_date = ?, external_examiner_required = ?
      WHERE id = ?
    `).run(title, release_date || null, deadline || null, marking_status, review_date || null, external_examiner_required ? 1 : 0, req.params.id);
    res.json({ message: 'Assessment updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/assessments/:id
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM assessments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Assessment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
