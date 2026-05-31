const pool = require('../config/db');
const { notifyWinner, notifyNoSale } = require('./email');

const ANTI_SNIPE_SECONDS = 60;
const commissionPercent = () => Number(process.env.COMMISSION_PERCENT || 5);

async function extendIfAntiSnipe(auctionId, conn) {
  const db = conn || pool;
  const [rows] = await db.query(
    'SELECT id, ends_at, status FROM auctions WHERE id = ? FOR UPDATE',
    [auctionId]
  );
  if (!rows.length || rows[0].status !== 'active') return null;

  const endsAt = new Date(rows[0].ends_at);
  const now = new Date();
  const secondsLeft = (endsAt - now) / 1000;

  if (secondsLeft > 0 && secondsLeft <= ANTI_SNIPE_SECONDS) {
    const newEnd = new Date(now.getTime() + ANTI_SNIPE_SECONDS * 1000);
    await db.query('UPDATE auctions SET ends_at = ? WHERE id = ?', [newEnd, auctionId]);
    return newEnd;
  }
  return endsAt;
}

async function finalizeEndedAuctions() {
  const [ended] = await pool.query(
    `SELECT a.*, u.email AS seller_email, u.name AS seller_name
     FROM auctions a
     JOIN users u ON u.id = a.seller_id
     WHERE a.status = 'active' AND a.ends_at <= NOW()`
  );

  for (const auction of ended) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [fresh] = await conn.query('SELECT * FROM auctions WHERE id = ? FOR UPDATE', [auction.id]);
      const a = fresh[0];
      if (!a || a.status !== 'active' || new Date(a.ends_at) > new Date()) {
        await conn.rollback();
        continue;
      }

      const metFloor = Number(a.current_bid) >= Number(a.floor_price) && a.bid_count > 0;

      if (metFloor && a.current_bidder_id) {
        await conn.query(
          `UPDATE auctions SET status = 'sold', winner_id = ? WHERE id = ?`,
          [a.current_bidder_id, a.id]
        );
        await conn.query(
          `INSERT INTO notifications (user_id, type, title, message)
           VALUES (?, 'won', ?, ?)`,
          [
            a.current_bidder_id,
            `You won: ${a.title}`,
            `Pay ${a.currency} ${a.current_bid} to complete your purchase.`,
          ]
        );
        await conn.query(
          `INSERT INTO notifications (user_id, type, title, message)
           VALUES (?, 'sold', ?, ?)`,
          [
            a.seller_id,
            `Sold: ${a.title}`,
            `Winner bid: ${a.currency} ${a.current_bid}. Await payment.`,
          ]
        );
        await conn.commit();

        const [[winner]] = await pool.query('SELECT * FROM users WHERE id = ?', [a.current_bidder_id]);
        const [[seller]] = await pool.query('SELECT * FROM users WHERE id = ?', [a.seller_id]);
        if (winner && seller) {
          await notifyWinner({
            winner,
            seller,
            auction: a,
            commission: commissionPercent(),
          });
        }
      } else {
        await conn.query(`UPDATE auctions SET status = 'no_sale' WHERE id = ?`, [a.id]);
        await conn.query(
          `INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'no_sale', ?, ?)`,
          [a.seller_id, `No sale: ${a.title}`, 'Floor price was not met. Listing closed.']
        );
        await conn.commit();
        const [[seller]] = await pool.query('SELECT * FROM users WHERE id = ?', [a.seller_id]);
        if (seller) await notifyNoSale({ seller, auction: a });
      }
    } catch (e) {
      await conn.rollback();
      console.error('Finalize auction error', auction.id, e.message);
    } finally {
      conn.release();
    }
  }
}

function startAuctionScheduler() {
  setInterval(() => {
    finalizeEndedAuctions().catch((e) => console.error('Scheduler error', e.message));
  }, 5000);
}

module.exports = {
  extendIfAntiSnipe,
  finalizeEndedAuctions,
  startAuctionScheduler,
  commissionPercent,
  ANTI_SNIPE_SECONDS,
};
