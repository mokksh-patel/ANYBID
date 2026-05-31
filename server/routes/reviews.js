const express = require('express');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/seller/:sellerId', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, u.name AS reviewer_name FROM reviews r
     JOIN users u ON u.id = r.reviewer_id
     WHERE r.seller_id = ? ORDER BY r.created_at DESC LIMIT 50`,
    [req.params.sellerId]
  );
  const [[stats]] = await pool.query(
    'SELECT ROUND(AVG(rating),1) AS avg_rating, COUNT(*) AS count FROM reviews WHERE seller_id = ?',
    [req.params.sellerId]
  );
  res.json({ reviews: rows, stats: stats || { avg_rating: 0, count: 0 } });
});

router.post('/', authRequired, async (req, res) => {
  try {
    const { seller_id, auction_id, rating, comment } = req.body;
    if (!seller_id || !auction_id || !rating) {
      return res.status(400).json({ error: 'seller_id, auction_id, rating required' });
    }
    const [auction] = await pool.query(
      'SELECT * FROM auctions WHERE id = ? AND winner_id = ? AND status = "sold"',
      [auction_id, req.user.id]
    );
    if (!auction.length && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only winner can review after purchase' });
    }
    await pool.query(
      'INSERT INTO reviews (seller_id, reviewer_id, auction_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [seller_id, req.user.id, auction_id, rating, comment || '']
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Already reviewed' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
