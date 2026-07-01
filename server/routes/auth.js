const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'dev-secret-change-me',
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone, verified) VALUES (?, ?, ?, ?, 1)',
      [email.toLowerCase().trim(), hash, name.trim(), phone || null]
    );
    const user = { id: result.insertId, email, name, role: 'user' };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [
      (email || '').toLowerCase().trim(),
    ]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authRequired, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, email, name, phone, role, verified, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

router.patch('/me', authRequired, async (req, res) => {
  try {
    const { name, phone, current_password, new_password } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
      updates.push('name = ?');
      params.push(name.trim().slice(0, 120));
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone ? phone.trim().slice(0, 20) : null);
    }

    if (new_password) {
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      if (!current_password) {
        return res.status(400).json({ error: 'Current password required to set a new password' });
      }
      const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
      const ok = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
      const hash = await bcrypt.hash(new_password, 10);
      updates.push('password_hash = ?');
      params.push(hash);
    }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.user.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updated] = await pool.query(
      'SELECT id, email, name, phone, role, verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
