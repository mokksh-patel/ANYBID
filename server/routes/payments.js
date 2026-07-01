const express = require('express');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { createOrder, verifyPaymentSignature, getRazorpay } = require('../services/razorpay');
const { commissionPercent } = require('../services/auctionEngine');

const router = express.Router();

router.get('/mine', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, a.title AS auction_title, a.image_path, a.category
       FROM payments p
       JOIN auctions a ON a.id = p.auction_id
       WHERE p.buyer_id = ?
       ORDER BY p.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/config', (_req, res) => {
  res.json({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    currency: process.env.DEFAULT_CURRENCY || 'INR',
    commission_percent: commissionPercent(),
    razorpay_enabled: Boolean(getRazorpay()),
  });
});

router.post('/create-order/:auctionId', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM auctions WHERE id = ?', [req.params.auctionId]);
    if (!rows.length) return res.status(404).json({ error: 'Auction not found' });
    const auction = rows[0];

    if (auction.status !== 'sold' || auction.winner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the winning bidder can pay' });
    }

    const amount = Number(auction.current_bid);
    const commission = (amount * commissionPercent()) / 100;
    const sellerPayout = amount - commission;
    const amountPaise = Math.round(amount * 100);

    const order = await createOrder({
      amountPaise,
      currency: auction.currency,
      receipt: `auction_${auction.id}`,
      notes: { auction_id: String(auction.id), buyer_id: String(req.user.id) },
    });

    const [existing] = await pool.query(
      'SELECT id FROM payments WHERE auction_id = ? AND buyer_id = ?',
      [auction.id, req.user.id]
    );
    if (existing.length) {
      await pool.query('UPDATE payments SET razorpay_order_id = ?, amount = ?, commission_amount = ?, seller_payout = ? WHERE id = ?', [
        order.id, amount, commission, sellerPayout, existing[0].id,
      ]);
    } else {
      await pool.query(
        `INSERT INTO payments (auction_id, buyer_id, razorpay_order_id, amount, commission_amount, seller_payout, currency, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [auction.id, req.user.id, order.id, amount, commission, sellerPayout, auction.currency]
      );
    }

    res.json({
      order_id: order.id,
      amount: amountPaise,
      currency: auction.currency,
      commission,
      seller_payout: sellerPayout,
      stub: order.stub || false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify', authRequired, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, auction_id } = req.body;
    const valid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) return res.status(400).json({ error: 'Payment verification failed' });

    await pool.query(
      `UPDATE payments SET status = 'paid', razorpay_payment_id = ? WHERE razorpay_order_id = ? AND buyer_id = ?`,
      [razorpay_payment_id, razorpay_order_id, req.user.id]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       SELECT seller_id, 'payment', 'Payment received', CONCAT('Buyer paid for auction #', ?) FROM auctions WHERE id = ?`,
      [auction_id, auction_id]
    );

    res.json({ ok: true, message: 'Payment successful. Seller will contact you for delivery.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fail', authRequired, async (req, res) => {
  try {
    const { razorpay_order_id, auction_id, error_description } = req.body;
    if (!razorpay_order_id) return res.status(400).json({ error: 'razorpay_order_id required' });

    await pool.query(
      `UPDATE payments SET status = 'failed' WHERE razorpay_order_id = ? AND buyer_id = ?`,
      [razorpay_order_id, req.user.id]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'payment_failed', 'Payment failed', ?)`,
      [req.user.id, `Payment failed for auction #${auction_id}. ${error_description || 'Please try again.'}`.slice(0, 255)]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
