const express = require('express');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { extendIfAntiSnipe, ANTI_SNIPE_SECONDS } = require('../services/auctionEngine');
const { notifyOutbid } = require('../services/email');

const router = express.Router();

router.post('/:auctionId', authRequired, async (req, res) => {
  const auctionId = req.params.auctionId;
  const { amount } = req.body;
  const bidAmount = Number(amount);

  if (!bidAmount || bidAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bid amount' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM auctions WHERE id = ? FOR UPDATE', [auctionId]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Auction not found' });
    }
    const auction = rows[0];

    if (auction.status !== 'active') {
      await conn.rollback();
      return res.status(400).json({ error: 'Auction is not active' });
    }
    if (new Date(auction.ends_at) <= new Date()) {
      await conn.rollback();
      return res.status(400).json({ error: 'Auction has ended' });
    }
    if (auction.seller_id === req.user.id) {
      await conn.rollback();
      return res.status(400).json({ error: 'You cannot bid on your own listing' });
    }

    const minBid = Math.max(
      Number(auction.current_bid) || 0,
      Number(auction.starting_bid)
    );
    const increment = minBid < 1000 ? 10 : minBid < 10000 ? 50 : 100;
    const requiredMin = (auction.bid_count > 0 ? minBid + increment : Number(auction.starting_bid));

    if (bidAmount < requiredMin) {
      await conn.rollback();
      return res.status(400).json({
        error: `Minimum bid is ${auction.currency} ${requiredMin}`,
        minimum: requiredMin,
      });
    }

    const previousBidderId = auction.current_bidder_id;

    await conn.query(
      `INSERT INTO bids (auction_id, bidder_id, amount) VALUES (?, ?, ?)`,
      [auctionId, req.user.id, bidAmount]
    );
    await conn.query(
      `UPDATE auctions SET current_bid = ?, current_bidder_id = ?, bid_count = bid_count + 1 WHERE id = ?`,
      [bidAmount, req.user.id, auctionId]
    );

    const newEndsAt = await extendIfAntiSnipe(auctionId, conn);
    await conn.commit();

    if (previousBidderId && previousBidderId !== req.user.id) {
      const [[prevUser]] = await pool.query('SELECT * FROM users WHERE id = ?', [previousBidderId]);
      const updatedAuction = { ...auction, id: auctionId, current_bid: bidAmount };
      if (prevUser) {
        await notifyOutbid({ user: prevUser, auction: updatedAuction, newAmount: bidAmount });
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'outbid', ?, ?)`,
          [
            previousBidderId,
            `Outbid: ${auction.title}`,
            `New highest bid: ${auction.currency} ${bidAmount}. Bid again!`,
          ]
        );
      }
    }

    res.json({
      ok: true,
      amount: bidAmount,
      ends_at: newEndsAt,
      anti_snipe_seconds: ANTI_SNIPE_SECONDS,
      message:
        newEndsAt && new Date(newEndsAt) > new Date(auction.ends_at)
          ? 'Bid placed! Timer extended by 60 seconds (BidRush mode).'
          : 'Bid placed successfully',
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
