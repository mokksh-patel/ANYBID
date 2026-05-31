/**
 * Clears all demo/fake listings. Marketplace starts empty for real sellers only.
 * Run: npm run db:clear
 */
require('dotenv').config();
const pool = require('../server/config/db');

async function clear() {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE bids');
  await pool.query('TRUNCATE TABLE reviews');
  await pool.query('TRUNCATE TABLE payments');
  await pool.query('TRUNCATE TABLE notifications');
  await pool.query('TRUNCATE TABLE auctions');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  // Remove demo seller accounts (keep admin + real registered users)
  const demoDomains = ['@seller.in', '@shop.in', '@store.in', '@mart.in', '@home.in', '@auto.in', '@craft.in'];
  for (const d of demoDomains) {
    await pool.query('DELETE FROM users WHERE email LIKE ? AND role != ?', [`%${d}`, 'admin']);
  }

  console.log('Demo listings removed. Marketplace is empty — only real seller listings will appear.');
  console.log('To list a real item: Login → + Sell');
  process.exit(0);
}

clear().catch((e) => {
  console.error(e);
  process.exit(1);
});
