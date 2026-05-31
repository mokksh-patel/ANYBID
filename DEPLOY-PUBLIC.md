# Deploy AnyBid publicly (like Flipkart / Amazon)

Your app needs **cloud hosting + MySQL** to be public 24/7. Localhost only works on your PC.

## Option A — Railway (recommended, ~5 min)

1. Create free account: [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo** (push this folder to GitHub first)
3. Add **MySQL** service: click **+ New** → **Database** → **MySQL**
4. Click your **web service** → **Variables** → **Add Reference** → link all `MYSQL*` vars from the database
5. Add these variables manually:
   ```
   JWT_SECRET=your-long-random-secret-here
   ADMIN_EMAIL=mokkshpatel@gmail.com
   COMMISSION_PERCENT=5
   APP_URL=https://YOUR-RAILWAY-URL.up.railway.app
   NODE_ENV=production
   DB_SSL=true
   ```
6. **Settings** → **Networking** → **Generate Domain**
7. Redeploy — your site is live at `https://xxxx.up.railway.app`

### Push to GitHub (one time)

```powershell
cd C:\Users\USER\Projects\anybid
git init
git add .
git commit -m "AnyBid marketplace — production ready"
# Create repo at github.com/new named anybid, then:
git remote add origin https://github.com/YOUR_USERNAME/anybid.git
git branch -M main
git push -u origin main
```

---

## Option B — Render + MySQL

Render uses **PostgreSQL** by default. This project uses **MySQL** — use Railway or Docker instead.

---

## Option C — Docker anywhere (VPS, Fly.io)

```bash
docker compose up -d --build
```

Opens on port **3000** with MySQL + 40+ real listings auto-seeded.

---

## Real marketplace data

After deploy (or locally):

```powershell
npm run db:reset
```

This loads **40+ live auctions** across Electronics, Fashion, Real Estate, Vehicles, etc. with:
- 8 verified Indian sellers
- Realistic INR prices
- Product photos (Unsplash)
- Active bids on many listings
- Seller reviews

| Account | Password | Role |
|---------|----------|------|
| mokkshpatel@gmail.com | Admin@123 | Admin |
| priya.sharma@seller.in | Seller@123 | Seller |
| rahul.verma@shop.in | Seller@123 | Seller |

---

## Razorpay + Email (production)

In cloud dashboard, add:

```
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
SMTP_USER=mokkshpatel@gmail.com
SMTP_PASS=your-gmail-app-password
```

---

## Quick public link (temporary, from your PC)

```powershell
npm run live
```

Shares a temporary URL while your PC is on — not permanent like Amazon.
