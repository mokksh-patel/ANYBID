require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../server/config/db');

async function seed() {
  const [users] = await pool.query('SELECT id FROM users WHERE email = ?', ['mokkshpatel@gmail.com']);
  const sellerId = users[0].id;

  const [existing] = await pool.query('SELECT id FROM auctions LIMIT 1');
  if (existing.length) {
    console.log('Sample auctions already exist.');
    process.exit(0);
  }

  const ends = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const samples = [
    ['Vintage Brass Water Bottle', 'Handcrafted brass bottle, 1L capacity. Unique patina.', 'Handmade', 500, 800, 0.3],
    ['iPhone 13 128GB', 'Good condition, battery 87%. With box and charger.', 'Electronics', 15000, 22000, 0.2],
    ['2BHK Flat — Koregaon Park, Pune', '850 sq ft, semi-furnished, ready to move. Great location.', 'Real Estate', 5000000, 6500000, 0],
    ['Hand-painted Madhubani Dupatta', 'Pure silk, artist signed. One of a kind.', 'Fashion', 1200, 2500, 0.1],
    ['Weird & Fun: Giant Teddy Bear', '6 feet tall plush bear. Won at carnival. Must go!', 'Weird & Fun', 800, 1500, 2],
  ];

  for (const [title, desc, cat, start, floor, weight] of samples) {
    const isEstate = cat === 'Real Estate';
    await pool.query(
      `INSERT INTO auctions (seller_id, title, description, category, listing_type, currency,
        starting_bid, floor_price, current_bid, shipping_weight_kg, property_location, property_area_sqft,
        duration_hours, ends_at, status)
       VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, 0, ?, ?, ?, 24, ?, 'active')`,
      [
        sellerId,
        title,
        desc,
        cat,
        isEstate ? 'real_estate' : 'product',
        start,
        floor,
        weight,
        isEstate ? 'Pune, Maharashtra' : null,
        isEstate ? 850 : null,
        ends,
      ]
    );
  }
  console.log('Seeded 5 sample auctions.');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
