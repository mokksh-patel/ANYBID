# Deploy AnyBid publicly

**Full step-by-step guide:** see **[GO-LIVE.md](./GO-LIVE.md)** in this folder.

## Short version

1. Push code to **GitHub**
2. Deploy on **Railway** + add **MySQL** database
3. Generate **public domain**
4. List real items via **+ Sell**

## Temporary public link (today, from your PC)

```powershell
cd C:\Users\USER\Projects\anybid
powershell -ExecutionPolicy Bypass -File scripts\go-live.ps1
```

Keep the window open. Share the `https://....loca.lt` URL.

## Important

- Only **real items you list** appear on the site (no fake demo products).
- Permanent hosting needs **Railway** (free tier) — see GO-LIVE.md.
- Admin: `mokkshpatel@gmail.com` / `Admin@123`
