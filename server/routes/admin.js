const express = require('express');
const pool = require('../config/db');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/stats', async (_req, res) => {
  const [[users]] = await pool.query('SELECT COUNT(*) AS c FROM users');
  const [[active]] = await pool.query(`SELECT COUNT(*) AS c FROM auctions WHERE status = 'active'`);
  const [[sold]] = await pool.query(`SELECT COUNT(*) AS c FROM auctions WHERE status = 'sold'`);
  const [[revenue]] = await pool.query(
    `SELECT COALESCE(SUM(commission_amount),0) AS total FROM payments WHERE status = 'paid'`
  );
  res.json({
    users: users.c,
    active_auctions: active.c,
    sold_auctions: sold.c,
    commission_earned: revenue.total,
  });
});

router.get('/auctions', async (req, res) => {
  const { flagged } = req.query;
  let sql = `SELECT a.*, u.name AS seller_name, u.email AS seller_email FROM auctions a JOIN users u ON u.id = a.seller_id`;
  const params = [];
  if (flagged === '1') {
    sql += ' WHERE a.flagged = 1';
  }
  sql += ' ORDER BY a.created_at DESC LIMIT 200';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

router.post('/flag/:id', async (req, res) => {
  const { reason } = req.body;
  await pool.query('UPDATE auctions SET flagged = 1, flag_reason = ? WHERE id = ?', [
    reason || 'Suspected fraud',
    req.params.id,
  ]);
  res.json({ ok: true });
});

router.post('/unflag/:id', async (req, res) => {
  await pool.query('UPDATE auctions SET flagged = 0, flag_reason = NULL WHERE id = ?', [
    req.params.id,
  ]);
  res.json({ ok: true });
});

router.delete('/auction/:id', async (req, res) => {
  await pool.query(`UPDATE auctions SET status = 'cancelled' WHERE id = ?`, [req.params.id]);
  res.json({ ok: true });
});

router.get('/users', async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT id, email, name, role, verified, created_at FROM users ORDER BY created_at DESC LIMIT 200'
  );
  res.json(rows);
});

module.exports = router;
