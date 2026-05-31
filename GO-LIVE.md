# AnyBid — Go Live (Public Website)

Follow these steps in order. Total time: **about 15 minutes**.

---

## Part 1 — Prepare on your PC (5 min)

### Step 1: Keep MySQL running

Open **XAMPP Control Panel** → start **MySQL**  
Or run:

```powershell
C:\xampp\mysql_start.bat
```

### Step 2: Test locally

```powershell
cd C:\Users\USER\Projects\anybid
npm start
```

Open **http://localhost:3000** — site should load (empty marketplace until you list items).

### Step 3: Commit latest code

```powershell
cd C:\Users\USER\Projects\anybid
git add .
git -c user.email="mokkshpatel@gmail.com" -c user.name="Mokksh Patel" commit -m "AnyBid ready for production"
```

---

## Part 2 — Put code on GitHub (5 min)

### Step 4: Create GitHub account / repo

1. Go to **https://github.com/new**
2. Repository name: `anybid`
3. Choose **Private** or **Public**
4. Do **not** add README (you already have code)
5. Click **Create repository**

### Step 5: Push your project

Replace `YOUR_GITHUB_USERNAME` with yours:

```powershell
cd C:\Users\USER\Projects\anybid
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/anybid.git
git push -u origin main
```

Sign in when Git asks (browser or token).

---

## Part 3 — Deploy to Railway (5 min) — **makes it public 24/7**

### Step 6: Create Railway account

1. Go to **https://railway.app**
2. Sign up with **GitHub**
3. Authorize Railway

### Step 7: New project from GitHub

1. Click **New Project**
2. **Deploy from GitHub repo**
3. Select **anybid**
4. Wait for first deploy (may fail until MySQL is added — normal)

### Step 8: Add MySQL database

1. In your project, click **+ New**
2. Choose **Database** → **Add MySQL**
3. Click your **web service** (Node app, not MySQL)
4. Go to **Variables** tab
5. Click **+ New Variable** → **Add Reference**
6. Select the MySQL service and add **all** variables (`MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`)

### Step 9: Add app settings

Still in **Variables**, add these **manually**:

| Variable | Value |
|----------|--------|
| `JWT_SECRET` | Any long random string (e.g. 32+ characters) |
| `ADMIN_EMAIL` | `mokkshpatel@gmail.com` |
| `COMMISSION_PERCENT` | `5` |
| `NODE_ENV` | `production` |
| `DB_SSL` | `true` |

### Step 10: Public URL

1. Click your **web service** → **Settings**
2. **Networking** → **Generate Domain**
3. Copy URL, e.g. `https://anybid-production.up.railway.app`
4. Add variable: `APP_URL` = that URL (same as your domain)
5. **Redeploy** (Deployments → three dots → Redeploy)

### Step 11: Initialize database (first deploy only)

1. Web service → **Settings** → check **Start Command** is empty (uses Dockerfile)  
   OR set: `node scripts/init-db.js && node server/index.js`
2. After deploy succeeds, open: `https://YOUR-URL.up.railway.app/api/health`  
   Should show `"ok": true`

---

## Part 4 — After you’re live

### List your first real item

1. Open your public URL
2. **Register** or login as admin: `mokkshpatel@gmail.com` / `Admin@123`
3. **+ Sell** → upload photo, title, price, floor price
4. Share the link with buyers

### Payments (Razorpay)

1. **https://dashboard.razorpay.com** → Test mode keys first
2. Add to Railway Variables:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`

### Email notifications (Gmail)

1. Google Account → **App passwords**
2. Railway Variables:
   - `SMTP_USER=mokkshpatel@gmail.com`
   - `SMTP_PASS=your-16-char-app-password`

---

## Quick test (temporary public link — PC must stay on)

```powershell
cd C:\Users\USER\Projects\anybid
npm start
```

In a **second** terminal:

```powershell
npm run live
```

Copy the `https://....loca.lt` URL — works until you close the terminal.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Deploy fails | Check Railway logs; ensure MySQL variables are linked |
| Database error | Redeploy after MySQL is connected; visit `/api/health` |
| Empty homepage | Normal — use **+ Sell** to add real items |
| Can't push to GitHub | Install GitHub Desktop or use `winget install GitHub.cli` |

---

**Your admin email on all platform notifications:** mokkshpatel@gmail.com
