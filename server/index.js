require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const { startAuctionScheduler } = require('./services/auctionEngine');

const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auctions');
const bidRoutes = require('./routes/bids');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'AnyBid',
    tagline: 'Bid on anything. Win everything.',
    admin: process.env.ADMIN_EMAIL || 'mokkshpatel@gmail.com',
  });
});

startAuctionScheduler();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AnyBid running on port ${PORT}`);
  console.log(`Admin: ${process.env.ADMIN_EMAIL || 'mokkshpatel@gmail.com'}`);
});
