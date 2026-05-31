# AnyBid

**Bid on anything. Win everything.**

Indian auction marketplace — eBay meets flash sale meets bazaar.

## Features (MVP)

- User registration & login (JWT)
- List anything: products **or real estate** with photo, floor price, duration (1h–1 week)
- Live countdown + **BidRush**: bids in the last 60 seconds extend the timer by 60s
- **Fair floor price**: no sale if bidding doesn’t reach the minimum
- Seller can **withdraw** before any bid
- Transparent bid history
- Search & categories (Electronics, Fashion, Real Estate, etc.)
- Outbid & winner **email** notifications (Gmail SMTP)
- **Razorpay** payment with configurable **commission %** (default 5%)
- Shipping estimate calculator
- Seller ratings (after purchase)
- Admin dashboard (flag fraud, stats) — `mokkshpatel@gmail.com`

## Quick start

### 1. Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) (for MySQL) **or** local MySQL 8

### 2. Install

```bash
cd C:\Users\USER\Projects\anybid
npm install
copy .env.example .env
```

Edit `.env` — at minimum set `JWT_SECRET`. For emails and payments add Gmail App Password and Razorpay test keys.

### 3. Start MySQL (XAMPP on Windows)

If you use **XAMPP** (recommended on Windows):

```powershell
C:\xampp\mysql_start.bat
```

Or run the helper script (starts MySQL + app):

```powershell
powershell -File scripts/start-local.ps1
```

Create DB user (first time only):

```powershell
Get-Content scripts/setup-mysql.sql | C:\xampp\mysql\bin\mysql.exe -u root
npm run db:init
npm run db:seed
```

**Docker alternative:**

```bash
docker compose up -d
npm run db:init
```

### 4. Run

```bash
npm start
```

Open **http://localhost:3000**

### Admin login

- Email: `mokkshpatel@gmail.com`
- Password: `Admin@123` (change after first login)

## Razorpay setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Dashboard → API Keys → **Test mode**
3. Add to `.env`:

```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

Without keys, payments run in **stub mode** for testing.

## Gmail notifications

1. Google Account → Security → 2FA on → **App passwords**
2. Add to `.env`:

```
SMTP_USER=mokkshpatel@gmail.com
SMTP_PASS=your-16-char-app-password
```

All emails BCC the admin address.

## Deploy (free tier)

- **Backend + MySQL**: [Railway](https://railway.app) or [Render](https://render.com)
- **Static frontend**: can stay with Express or split to Vercel (point API to your backend URL)

Set `APP_URL` in production for email links.

## Brand pillars

| Pillar | Meaning |
|--------|---------|
| **ANYTHING** | Any item, any category |
| **FAIR** | Floor price + transparent bids |
| **LIVE** | Real-time timer + BidRush |

## Commission

Platform takes `COMMISSION_PERCENT` (default **5%**) on each successful Razorpay payment. Shown to winner at checkout.

## Next steps (Phase 2)

- SMS via Twilio/MSG91
- Web push notifications (service worker)
- KYC / verified seller badges
- Escrow payouts to sellers

---

Built for **Mokksh Patel** · mokkshpatel@gmail.com
