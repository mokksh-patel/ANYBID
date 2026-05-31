/**
 * Realistic Indian marketplace seed — Flipkart/Meesho-style listings.
 * Run: npm run db:reset   (clears auctions & reseeds)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../server/config/db');

const SELLERS = [
  { email: 'mokkshpatel@gmail.com', name: 'Mokksh Patel', phone: '+919876543210', role: 'admin' },
  { email: 'priya.sharma@seller.in', name: 'Priya Sharma', phone: '+919812345678' },
  { email: 'rahul.verma@shop.in', name: 'Rahul Verma', phone: '+919988776655' },
  { email: 'anjali.reddy@store.in', name: 'Anjali Reddy', phone: '+919700112233' },
  { email: 'vikram.singh@mart.in', name: 'Vikram Singh', phone: '+919811223344' },
  { email: 'meera.nair@home.in', name: 'Meera Nair', phone: '+919900556677' },
  { email: 'arjun.patel@auto.in', name: 'Arjun Patel', phone: '+919877665544' },
  { email: 'kavita.jain@craft.in', name: 'Kavita Jain', phone: '+919866554433' },
];

const PASSWORD = 'Seller@123';

const LISTINGS = [
  // Electronics
  { title: 'Samsung Galaxy S23 5G (128GB, Phantom Black)', desc: 'Warranty till Dec 2026. No scratches. Bill & box included. 78% battery health.', cat: 'Electronics', start: 28000, floor: 35000, w: 0.2, img: 'photo-1610945265064-0e34e55182dd', seller: 1 },
  { title: 'Apple MacBook Air M1 (8GB/256GB)', desc: '2020 model, lightly used for college. Charger included. Perfect display.', cat: 'Electronics', start: 45000, floor: 58000, w: 1.2, img: 'photo-1517336714731-489689fd1ca8', seller: 2 },
  { title: 'Sony WH-1000XM5 Noise Cancelling Headphones', desc: '6 months old, mint condition. All accessories + case.', cat: 'Electronics', start: 18000, floor: 24000, w: 0.4, img: 'photo-1618366712010-f156aebadbe8', seller: 3 },
  { title: 'LG 43" 4K Smart LED TV (2023)', desc: 'Wall mount included. Remote + stand. Pickup from Mumbai Andheri.', cat: 'Electronics', start: 22000, floor: 28000, w: 8, img: 'photo-1593359677879-a4bb92f829d1', seller: 4 },
  { title: 'Canon EOS 200D II DSLR Kit (18-55mm)', desc: 'Shutter count ~8k. Bag, 2 batteries, 32GB card.', cat: 'Electronics', start: 35000, floor: 42000, w: 1.5, img: 'photo-1516035069371-29a1c244cc32', seller: 2 },
  { title: 'PlayStation 5 Disc Edition + 2 Controllers', desc: '1 year old. FIFA 24 + Spider-Man 2 discs included.', cat: 'Electronics', start: 38000, floor: 45000, w: 3.5, img: 'photo-1606813907291-d86efa9b94db', seller: 5 },
  { title: 'OnePlus Nord CE 3 Lite 5G (8/128GB)', desc: 'Brand warranty 4 months left. Aqua Surge colour.', cat: 'Electronics', start: 12000, floor: 15500, w: 0.2, img: 'photo-1598327275664-499c12aeebd1', seller: 6 },
  { title: 'DJI Mini 3 Pro Fly More Combo', desc: '3 batteries, RC remote. Only 15 flights. DGCA compliant.', cat: 'Electronics', start: 55000, floor: 68000, w: 0.8, img: 'photo-1473968512647-3e447244af8f', seller: 7 },
  // Fashion
  { title: 'Banarasi Silk Saree — Wedding Collection', desc: 'Pure silk, zari work. Worn once. Dry cleaned. Blouse piece unstitched.', cat: 'Fashion', start: 8500, floor: 12000, w: 0.5, img: 'photo-1610030469988-65662986174c', seller: 3 },
  { title: 'Nike Air Jordan 1 Retro High (UK 9)', desc: '100% authentic. Box + extra laces. Worn 3 times indoors.', cat: 'Fashion', start: 9000, floor: 14000, w: 0.6, img: 'photo-1542291026-7eec264c27ff', seller: 4 },
  { title: 'Louis Philippe Men\'s Blazer (Size 40)', desc: 'Navy blue, slim fit. Dry cleaned. Perfect for interviews.', cat: 'Fashion', start: 2500, floor: 4000, w: 0.4, img: 'photo-1594938298603-c8148c4dae35', seller: 5 },
  { title: 'Kundan Bridal Jewellery Set (Necklace + Earrings)', desc: 'Gold-plated, American diamonds. Complete set with box.', cat: 'Fashion', start: 4500, floor: 7500, w: 0.3, img: 'photo-1515562141207-7a88fb7ce338', seller: 6 },
  { title: 'H&M Winter Coat — Women (M)', desc: 'Imported from UK. Barely used. Beige colour.', cat: 'Fashion', start: 1800, floor: 2800, w: 0.8, img: 'photo-1539533018447-63fcce2678e3', seller: 7 },
  { title: 'Ray-Ban Aviator Classic (Polarized)', desc: 'Model RB3025. Original case & cloth. Minor wear on temples.', cat: 'Fashion', start: 5500, floor: 8000, w: 0.1, img: 'photo-1572635196233-39b5b58658b0', seller: 2 },
  // Home
  { title: 'Dyson V11 Cordless Vacuum Cleaner', desc: 'All attachments. Filter washed regularly. Works perfectly.', cat: 'Home', start: 22000, floor: 28000, w: 2.5, img: 'photo-1558317374-673fbba37d96', seller: 4 },
  { title: 'IKEA KALLAX Shelf Unit (White, 4x4)', desc: 'Assembled. Pickup only Bangalore Whitefield. No scratches.', cat: 'Home', start: 3500, floor: 5500, w: 15, img: 'photo-1594620302202-9c785ef2454f', seller: 5 },
  { title: 'Prestige Iris 750W Mixer Grinder', desc: '3 jars, 1 year old. Motor in excellent condition.', cat: 'Home', start: 2200, floor: 3200, w: 3, img: 'photo-1585515320310-259814833e62', seller: 6 },
  { title: 'Wakefit Orthopedic Memory Foam Mattress (Queen)', desc: '6 inch, 3 years old. Always with cover. No stains.', cat: 'Home', start: 8000, floor: 11000, w: 25, img: 'photo-1631049307264-da0ec9d70304', seller: 7 },
  { title: 'Bosch 7kg Front Load Washing Machine', desc: 'Inverter motor. Free delivery within 10km Pune.', cat: 'Home', start: 15000, floor: 19000, w: 35, img: 'photo-1626806787461-102c1bfaaea1', seller: 3 },
  // Handmade
  { title: 'Handloom Chanderi Dupatta — Block Print', desc: 'MP artisan cluster. Natural dyes. Certificate of authenticity.', cat: 'Handmade', start: 1200, floor: 2000, w: 0.15, img: 'photo-1601924994987-69e26d50ca26', seller: 8 },
  { title: 'Terracotta Dinner Set (12 pieces)', desc: 'Khurja pottery. Microwave safe glaze. Artist signed.', cat: 'Handmade', start: 2800, floor: 4500, w: 4, img: 'photo-1578749552338-74b70388c117', seller: 8 },
  { title: 'Pattachitra Painting — Lord Jagannath (24x18")', desc: 'Odisha traditional art on cloth. Framed.', cat: 'Handmade', start: 6500, floor: 9500, w: 1, img: 'photo-1579783902614-a3fb3927b6a3', seller: 8 },
  { title: 'Brass Diya Set + Urli (Festival Decor)', desc: 'Handcrafted Moradabad brass. 9-piece set.', cat: 'Handmade', start: 1800, floor: 2800, w: 2, img: 'photo-1604704197729-7dad21e35b5e', seller: 8 },
  // Vehicles
  { title: 'Royal Enfield Classic 350 (2022) — Gunmetal Grey', desc: '12,400 km. Single owner. Service records at showroom.', cat: 'Vehicles', start: 145000, floor: 165000, w: 0, img: 'photo-1558981403-c5f9899a693c', seller: 7 },
  { title: 'Honda City VX CVT (2019 Petrol)', desc: '45k km. No accident. Insurance Dec 2026. Delhi NCR.', cat: 'Vehicles', start: 620000, floor: 700000, w: 0, img: 'photo-1606664515523-ed4f711a0c68', seller: 6 },
  { title: 'Hero Splendor Plus (2023) — Excellent Condition', desc: '8,200 km. New tyres. RC transfer ready.', cat: 'Vehicles', start: 52000, floor: 58000, w: 0, img: 'photo-1622185135855-772c7043da0c', seller: 5 },
  // Real Estate
  { title: '2BHK Apartment — HSR Layout, Bengaluru', desc: '950 sq ft, 2nd floor, covered parking. Gated society, gym & pool.', cat: 'Real Estate', start: 7200000, floor: 8500000, w: 0, loc: 'HSR Layout, Bengaluru', sqft: 950, img: 'photo-1560518883-ce09059eeffa', seller: 1, estate: true },
  { title: '3BHK Villa — Noida Sector 150', desc: '1800 sq ft built-up. Corner plot. Ready to move.', cat: 'Real Estate', start: 12500000, floor: 14500000, w: 0, loc: 'Sector 150, Noida', sqft: 1800, img: 'photo-1600596542815-ffad4c1539a9', seller: 2, estate: true },
  { title: 'Commercial Shop — Linking Road, Mumbai', desc: '450 sq ft ground floor. High footfall. Lease transferable.', cat: 'Real Estate', start: 35000000, floor: 42000000, w: 0, loc: 'Linking Road, Bandra West', sqft: 450, img: 'photo-1486406146926-c627a92fd1b2', seller: 3, estate: true },
  { title: '1RK Studio — Indiranagar (For Rent-to-Own Auction)', desc: '550 sq ft, furnished. Near metro. Ideal investment.', cat: 'Real Estate', start: 4200000, floor: 5000000, w: 0, loc: 'Indiranagar, Bengaluru', sqft: 550, img: 'photo-1502672260266-1c1ef9375b4a', seller: 4, estate: true },
  // Weird & Fun + Anything
  { title: 'Vintage Bajaj Chetak Scooter (1985) — Restored', desc: 'Fully restored, runs smooth. Collector\'s piece. Pink colour.', cat: 'Weird & Fun', start: 35000, floor: 50000, w: 0, img: 'photo-1622185135855-772c7043da0c', seller: 5 },
  { title: 'Cricket Bat — Signed by Virat Kohli (2019)', desc: 'Certificate of authenticity from BCCI event. Display case included.', cat: 'Weird & Fun', start: 25000, floor: 40000, w: 0.5, img: 'photo-1531415071028-cebf6e03fe88', seller: 6 },
  { title: 'Giant Teddy Bear 6ft — Carnival Prize', desc: 'Clean, smoke-free home. Must sell before moving.', cat: 'Weird & Fun', start: 800, floor: 1500, w: 3, img: 'photo-1559454403-1391e1feb58e', seller: 7 },
  { title: 'Brass Water Bottle (Matka Style) — Handcrafted', desc: '1L capacity, ayurvedic copper-lined. Jaipur artisan.', cat: 'Anything', start: 450, floor: 750, w: 0.4, img: 'photo-1602143407151-7111542de6e8', seller: 8 },
  { title: 'College Textbooks Bundle — Engineering (CSE)', desc: '20 books: DSA, OS, DBMS, CN. Some with notes. GTU syllabus.', cat: 'Anything', start: 1200, floor: 2000, w: 5, img: 'photo-1544716278-ca5e3f4abd8c', seller: 2 },
  { title: 'Acoustic Guitar — Yamaha F310', desc: '6 months old. Extra strings + padded bag. Great for beginners.', cat: 'Anything', start: 5500, floor: 7500, w: 2, img: 'photo-1510915361897-7918ed7a1047', seller: 3 },
  { title: 'Rolex Submariner Homage (Automatic) — Orient Kamasu', desc: 'Honest listing: Orient brand, not Rolex. Sapphire crystal.', cat: 'Anything', start: 14000, floor: 18000, w: 0.2, img: 'photo-1523275335684-37898b6baf30', seller: 4 },
  { title: 'Antique Brass Temple Bell — 19th Century', desc: 'Collected from Kerala estate sale. Patina intact.', cat: 'Anything', start: 12000, floor: 18000, w: 1.2, img: 'photo-1604704197729-7dad21e35b5e', seller: 8 },
  { title: 'iPad Air 5th Gen (64GB WiFi) + Apple Pencil', desc: 'Space grey. Screen protector day one. No AppleCare.', cat: 'Electronics', start: 38000, floor: 46000, w: 0.5, img: 'photo-1544244015-0df4b3ffc6b0', seller: 1 },
  { title: 'Milton Water Bottle Bulk (24 pcs) — Sealed', desc: 'Surplus stock from cancelled corporate order. 1L each.', cat: 'Anything', start: 2400, floor: 3600, w: 8, img: 'photo-1602143407151-7111542de6e8', seller: 5 },
  { title: 'Designer Lehenga — Anita Dongre Inspired', desc: 'Worn once for wedding. Heavy embroidery. Dry cleaned.', cat: 'Fashion', start: 15000, floor: 22000, w: 1.5, img: 'photo-1595777453413-35b5a0c4b0c0', seller: 3 },
  { title: 'Mi Air Purifier 3H', desc: 'HEPA filter 80% life left. App connected. Delhi pickup.', cat: 'Home', start: 6500, floor: 9000, w: 4, img: 'photo-1585771723684-90a3b6c3f7e1', seller: 6 },
  { title: 'Treadmill — Maxpro (Foldable)', desc: 'Home use 1 year. Max weight 110kg. All functions working.', cat: 'Home', start: 12000, floor: 16000, w: 35, img: 'photo-1576678927484-cc907957088c', seller: 7 },
  { title: 'Lab Grown Diamond Ring — 1 Carat (IGI Cert)', desc: '14k white gold setting. Bought for ₹1.8L, selling urgent.', cat: 'Fashion', start: 95000, floor: 120000, w: 0.05, img: 'photo-1605100804763-247f67b3557e', seller: 6 },
];

function imgUrl(id) {
  return `https://images.unsplash.com/${id}?w=600&q=80`;
}

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

async function ensureSellers() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const ids = [];
  for (const s of SELLERS) {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [s.email]);
    if (rows.length) {
      ids.push(rows[0].id);
    } else {
      const [r] = await pool.query(
        'INSERT INTO users (email, password_hash, name, phone, role, verified) VALUES (?, ?, ?, ?, ?, 1)',
        [s.email, hash, s.name, s.phone || null, s.role || 'user']
      );
      ids.push(r.insertId);
    }
  }
  return ids;
}

async function clearMarketplace() {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE bids');
  await pool.query('TRUNCATE TABLE reviews');
  await pool.query('TRUNCATE TABLE payments');
  await pool.query('TRUNCATE TABLE notifications');
  await pool.query('TRUNCATE TABLE auctions');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function seed() {
  const sellerIds = await ensureSellers();
  await clearMarketplace();

  const durations = [6, 12, 24, 48, 72, 168];
  let count = 0;

  for (const item of LISTINGS) {
    const sellerId = sellerIds[item.seller] || sellerIds[0];
    const isEstate = item.estate || item.cat === 'Real Estate';
    const hours = durations[count % durations.length];
    const ends = hoursFromNow(hours);
    const hasBids = count % 3 === 0;
    const currentBid = hasBids ? item.start + Math.floor((item.floor - item.start) * 0.4) : 0;
    const bidCount = hasBids ? Math.floor(Math.random() * 8) + 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO auctions (seller_id, title, description, category, listing_type, image_path, currency,
        starting_bid, floor_price, current_bid, bid_count, shipping_weight_kg, property_location,
        property_area_sqft, duration_hours, ends_at, status)
       VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        sellerId,
        item.title,
        item.desc,
        item.cat,
        isEstate ? 'real_estate' : 'product',
        imgUrl(item.img),
        item.start,
        item.floor,
        currentBid,
        bidCount,
        item.w ?? 0.5,
        item.loc || null,
        item.sqft || null,
        hours,
        ends,
      ]
    );

    if (hasBids && bidCount > 0) {
      const buyerId = sellerIds[(count + 2) % sellerIds.length];
      for (let b = 0; b < bidCount; b++) {
        const amt = item.start + ((item.floor - item.start) * (b + 1)) / (bidCount + 1);
        await pool.query('INSERT INTO bids (auction_id, bidder_id, amount) VALUES (?, ?, ?)', [
          result.insertId,
          buyerId,
          Math.round(amt),
        ]);
      }
      await pool.query('UPDATE auctions SET current_bidder_id = ? WHERE id = ?', [buyerId, result.insertId]);
    }
    count++;
  }

  // Seller reviews
  const reviewTexts = [
    [5, 'Fast shipping, product exactly as described. Highly recommended!'],
    [5, 'Genuine seller. Packaging was excellent.'],
    [4, 'Good experience. Minor delay in courier but item perfect.'],
    [5, 'Trustworthy seller — bid with confidence.'],
    [4, 'Responsive on phone. Item matched photos.'],
  ];
  for (let i = 1; i < sellerIds.length; i++) {
    const reviewerId = sellerIds[(i + 3) % sellerIds.length];
    const [auctions] = await pool.query('SELECT id FROM auctions WHERE seller_id = ? LIMIT 1', [sellerIds[i]]);
    if (auctions.length) {
      const [r] = reviewTexts[i % reviewTexts.length];
      try {
        await pool.query(
          'INSERT INTO reviews (seller_id, reviewer_id, auction_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
          [sellerIds[i], reviewerId, auctions[0].id, r, reviewTexts[i % reviewTexts.length][1]]
        );
      } catch {}
    }
  }

  console.log(`Marketplace seeded: ${count} live auctions, ${SELLERS.length} sellers.`);
  console.log(`Demo seller password (all sellers): ${PASSWORD}`);
  process.exit(0);
}

const force = process.argv.includes('--force');
seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
