const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const router = express.Router();

const staffOnly = rbac('academic_staff');

// GET /api/modules — list all modules
router.get('/', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT m.*, u.name as created_by_name
      FROM modules m
      LEFT JOIN users u ON u.id = m.created_by
      ORDER BY m.code
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/modules/:id — single module
router.get('/:id', auth, (req, res) => {
  try {
    const row = db.prepare(`
      SELECT m.*, u.name as created_by_name
      FROM modules m
      LEFT JOIN users u ON u.id = m.created_by
      WHERE m.id = ?
    `).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Module not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/modules — create module
router.post('/', auth, staffOnly, (req, res) => {
  const { code, title, credits, level } = req.body;
  if (!code || !title) return res.status(400).json({ error: 'code and title are required' });
  try {
    const result = db.prepare(`
      INSERT INTO modules (code, title, credits, level, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(code, title, credits || null, level || null, req.user.id);
    res.status(201).json({ message: 'Module created', id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Module code already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/modules/:id — update module
router.put('/:id', auth, staffOnly, (req, res) => {
  const { code, title, credits, level } = req.body;
  try {
    db.prepare(`
      UPDATE modules SET code = ?, title = ?, credits = ?, level = ? WHERE id = ?
    `).run(code, title, credits || null, level || null, req.params.id);
    res.json({ message: 'Module updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/modules/:id
router.delete('/:id', auth, staffOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM modules WHERE id = ?').run(req.params.id);
    res.json({ message: 'Module deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
