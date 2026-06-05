const express = require('express');
const multer = require('multer');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

const upload = multer({ dest: 'uploads/evidence/' });

// GET /api/evidence — all evidence items
router.get('/', auth, (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT e.*, u.name AS uploaded_by_name
      FROM evidence e
      LEFT JOIN users u ON u.id = e.uploaded_by
      ORDER BY e.uploaded_at DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/evidence — upload evidence record (with optional file)
router.post('/', auth, upload.single('file'), (req, res) => {
  const { title, category } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  try {
    const filePath = req.file ? req.file.path : null;
    const result = db.prepare(`
      INSERT INTO evidence (uploaded_by, title, file_path, category)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, title, filePath, category || null);
    res.status(201).json({ message: 'Evidence recorded', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/evidence/file/:id — serve the uploaded file
router.get('/file/:id', auth, (req, res) => {
  try {
    const row = db.prepare('SELECT file_path, title FROM evidence WHERE id = ?').get(req.params.id);
    if (!row || !row.file_path) return res.status(404).json({ error: 'File not found' });
    const path = require('path');
    const fs = require('fs');
    const abs = path.resolve(row.file_path);
    if (!fs.existsSync(abs)) return res.status(404).json({ error: 'File not found on disk' });
    res.download(abs, row.title);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/evidence/:id
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM evidence WHERE id = ?').run(req.params.id);
    res.json({ message: 'Evidence deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
