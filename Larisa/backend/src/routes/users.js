const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const auth = require('../middleware/auth');
const logAudit = require('../db/audit');
const router = express.Router();

// GET /api/users — all users (no password hash returned)
router.get('/', auth, (_req, res) => {
  try {
    const rows = db.prepare(
      'SELECT id, name, email, role, created_at FROM users ORDER BY name'
    ).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — create user (admin)
router.post('/', auth, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are required' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, hash, role);
    logAudit(req.user, `Created user account for ${name} (${email}) with role ${role}`, 'success');
    res.status(201).json({ message: 'User created', id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — update user (name, email, role; password optional)
router.put('/:id', auth, async (req, res) => {
  const { name, email, role, password } = req.body;
  try {
    // Fetch the existing user to detect role changes
    const existing = db.prepare('SELECT name, email, role FROM users WHERE id = ?').get(req.params.id);

    if (password) {
      const hash = await bcrypt.hash(password, 12);
      db.prepare(
        'UPDATE users SET name = ?, email = ?, role = ?, password_hash = ? WHERE id = ?'
      ).run(name, email, role, hash, req.params.id);
    } else {
      db.prepare(
        'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?'
      ).run(name, email, role, req.params.id);
    }

    if (existing && existing.role !== role) {
      logAudit(
        req.user,
        `Changed role of ${name} from ${existing.role} to ${role}`,
        'warning',
        `User: ${email}`
      );
    } else {
      logAudit(req.user, `Updated user account for ${name} (${email})`, 'info');
    }

    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT name, email FROM users WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    if (existing) {
      logAudit(req.user, `Deleted user account for ${existing.name} (${existing.email})`, 'warning');
    }
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
