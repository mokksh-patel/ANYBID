const express = require('express');
const pool = require('../config/db');
const upload = require('../middleware/upload');
const { authRequired } = require('../middleware/auth');
const { estimateShipping } = require('../services/shipping');

const router = express.Router();

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home',
  'Handmade',
  'Real Estate',
  'Vehicles',
  'Weird & Fun',
  'Anything',
];

const DURATION_MAP = { '1h': 1, '6h': 6, '1d': 24, '3d': 72, '1w': 168 };

router.get('/meta', (_req, res) => {
  res.json({
    categories: CATEGORIES,
    durations: Object.keys(DURATION_MAP),
    currencies: ['INR', 'USD', 'EUR'],
    tagline: 'Bid on anything. Win everything.',
    pillars: ['ANYTHING', 'FAIR', 'LIVE'],
    commissionPercent: Number(process.env.COMMISSION_PERCENT || 5),
  });
});

router.get('/shipping-estimate', (req, res) => {
  const { weightKg, pincode } = req.query;
  res.json(estimateShipping({ weightKg, pincode }));
});

router.get('/mine', authRequired, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.*, u.name AS seller_name FROM auctions a
     JOIN users u ON u.id = a.seller_id
     WHERE a.seller_id = ? OR a.current_bidder_id = ?
     ORDER BY a.created_at DESC LIMIT 100`,
    [req.user.id, req.user.id]
  );
  res.json(rows);
});

router.get('/', async (req, res) => {
  try {
    const { q, category, status = 'active', listing_type, sort = 'ending' } = req.query;
    let sql = `
      SELECT a.*, u.name AS seller_name,
        (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.seller_id = a.seller_id) AS seller_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.seller_id = a.seller_id) AS seller_review_count
      FROM auctions a
      JOIN users u ON u.id = a.seller_id
      WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (category) {
      sql += ' AND a.category = ?';
      params.push(category);
    }
    if (listing_type) {
      sql += ' AND a.listing_type = ?';
      params.push(listing_type);
    }
    if (q) {
      sql += ' AND (a.title LIKE ? OR a.description LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term);
    }

    if (sort === 'new') sql += ' ORDER BY a.created_at DESC';
    else if (sort === 'price') sql += ' ORDER BY a.current_bid DESC';
    else sql += ' ORDER BY a.ends_at ASC';

    sql += ' LIMIT 100';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.name AS seller_name, u.email AS seller_email, u.phone AS seller_phone,
        (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.seller_id = a.seller_id) AS seller_rating
       FROM auctions a JOIN users u ON u.id = a.seller_id WHERE a.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Auction not found' });
    const [bids] = await pool.query(
      `SELECT b.amount, b.created_at, u.name AS bidder_name, u.id AS bidder_id
       FROM bids b JOIN users u ON u.id = b.bidder_id
       WHERE b.auction_id = ? ORDER BY b.created_at DESC LIMIT 50`,
      [req.params.id]
    );
    res.json({ auction: rows[0], bids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authRequired, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      starting_bid,
      floor_price,
      duration = '1d',
      currency = 'INR',
      listing_type = 'product',
      shipping_weight_kg,
      property_location,
      property_area_sqft,
    } = req.body;

    const hours = DURATION_MAP[duration] || 24;
    if (!title || !category || starting_bid == null || floor_price == null) {
      return res.status(400).json({ error: 'Title, category, starting bid, and floor price required' });
    }
    if (Number(floor_price) < Number(starting_bid)) {
      return res.status(400).json({ error: 'Floor price must be >= starting bid' });
    }

    const endsAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO auctions
        (seller_id, title, description, category, listing_type, image_path, currency,
         starting_bid, floor_price, current_bid, shipping_weight_kg, property_location,
         property_area_sqft, duration_hours, ends_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'active')`,
      [
        req.user.id,
        title,
        description || '',
        category,
        listing_type,
        imagePath,
        currency,
        starting_bid,
        floor_price,
        shipping_weight_kg || 0.5,
        property_location || null,
        property_area_sqft || null,
        hours,
        endsAt,
      ]
    );

    res.status(201).json({ id: result.insertId, ends_at: endsAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/cancel', authRequired, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM auctions WHERE id = ? FOR UPDATE', [
      req.params.id,
    ]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Not found' });
    }
    const a = rows[0];
    if (a.seller_id !== req.user.id && req.user.role !== 'admin') {
      await conn.rollback();
      return res.status(403).json({ error: 'Only seller can cancel' });
    }
    if (a.bid_count > 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Cannot cancel after bids have been placed' });
    }
    if (a.status !== 'active') {
      await conn.rollback();
      return res.status(400).json({ error: 'Auction is not active' });
    }
    await conn.query(`UPDATE auctions SET status = 'cancelled' WHERE id = ?`, [a.id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.get('/:id/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = async () => {
    const [rows] = await pool.query(
      `SELECT id, current_bid, bid_count, ends_at, status, current_bidder_id FROM auctions WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length) {
      const a = rows[0];
      const secondsLeft = Math.max(0, Math.floor((new Date(a.ends_at) - Date.now()) / 1000));
      res.write(
        `data: ${JSON.stringify({ ...a, seconds_left: secondsLeft, server_time: Date.now() })}\n\n`
      );
    }
  };

  await send();
  const interval = setInterval(send, 1000);
  req.on('close', () => clearInterval(interval));
});

module.exports = router;
