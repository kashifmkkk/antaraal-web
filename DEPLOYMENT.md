# Antaraal Skyway Trade - Deployment Guide

## Architecture

| Component | Host | URL |
|-----------|------|-----|
| Frontend (React) | GoDaddy cPanel - antaraalspace.com | https://antaraalspace.com |
| Backend (Node.js API) | Render.com (free tier) | https://antaraal-backend.onrender.com |
| Database (PostgreSQL) | Render.com (free tier) | Auto-provisioned |

---

## STEP 1: Deploy Backend to Render.com (Free)

### 1A. Push backend to GitHub
1. Create a **new GitHub repository** (e.g., `antaraal-backend`)
2. Push only the `backend/` folder contents to it:
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial backend deployment"
   git remote add origin https://github.com/YOUR_USERNAME/antaraal-backend.git
   git branch -M main
   git push -u origin main
   ```

### 1B. Create Render account & deploy
1. Go to **https://render.com** and sign up (free, use GitHub login)
2. Click **"New +"** → **"PostgreSQL"**
   - Name: `antaraal-db`
   - Plan: **Free**
   - Click **"Create Database"**
   - Copy the **Internal Database URL** (looks like `postgresql://antaraal:xxxx@dpg-xxxx/antaraal`)

3. Click **"New +"** → **"Web Service"**
   - Connect your `antaraal-backend` GitHub repo
   - Settings:
     - **Name**: `antaraal-backend`
     - **Runtime**: Node
     - **Build Command**: `npm install && npx prisma generate && npm run build`
       - **Start Command**: `npm run start:render`
     - **Plan**: Free
   - **Environment Variables** (click "Add Environment Variable"):
       - `DATABASE_URL` = (paste the Internal Database URL from step 2)
       - `DATABASE_URL_INTERNAL` = (optional fallback to same Internal URL)
     - `JWT_SECRET` = (any random secure string, e.g., `SkywayTrade2025SecretKey!@#`)
     - `PORT` = `4000`
     - `NODE_ENV` = `production`
       - `DB_MIGRATE_MAX_ATTEMPTS` = `15`
       - `DB_MIGRATE_BASE_DELAY_MS` = `2000`
   - Click **"Create Web Service"**

4. Wait for the build to complete (5-10 minutes)
5. Your backend URL will be: `https://antaraal-backend.onrender.com`
6. Test it: visit `https://antaraal-backend.onrender.com/api/health` — should return `{"status":"ok"}`

### 1C. Seed the database (one-time)
After the backend is deployed, open the **Render Shell** (Dashboard → your service → "Shell" tab):
```bash
npx ts-node prisma/seed.ts
```
Or trigger it from the Render console.

---

## STEP 2: Build Frontend with Correct Backend URL

### 2A. Update the API URL
Edit the file `.env.production` in the project root:
```env
VITE_API_BASE=https://antaraal-backend.onrender.com
```
Replace with your **actual Render backend URL** from Step 1.

### 2B. Build the frontend
```bash
npm run build
```
This creates a `dist/` folder with all static files.

---

## STEP 3: Deploy Frontend to GoDaddy cPanel

### 3A. Log into cPanel
1. Go to your GoDaddy account → **My Products** → **Web Hosting** → **Manage**
2. Click **cPanel Admin** to open cPanel

### 3B. Upload files via File Manager
1. In cPanel, click **"File Manager"**
2. Navigate to **`public_html/`** folder
3. **Delete** all existing files in `public_html/` (if any default files exist)
4. Click **"Upload"** button in the top toolbar
5. Upload **ALL files and folders** from your local `dist/` folder:
   ```
   dist/
   ├── .htaccess          ← IMPORTANT: enables SPA routing
   ├── index.html
   ├── favicon.ico
   ├── logo.png
   ├── placeholder.svg
   ├── robots.txt
   └── assets/
       ├── index-ChMbfxNN.js
       ├── index-DmKG2T0p.css
       ├── hero-aerospace-LEmk1S1F.jpg
       ├── engine-blade-COYWWS6X.jpg
       ├── ... (all other asset files)
   ```

6. **Alternative: Upload as ZIP**
   - Compress the `dist/` folder contents into a `.zip` file
   - Upload the `.zip` to `public_html/`
   - Right-click the zip → **"Extract"**
   - Make sure files are directly in `public_html/`, NOT in `public_html/dist/`
   - Delete the `.zip` after extracting

### 3C. Verify .htaccess is uploaded
This is **critical** for React Router to work! Without it, refreshing any page other than the homepage will show a 404 error.

1. In File Manager, make sure **"Show Hidden Files"** is enabled (Settings → check "Show Hidden Files")
2. Verify `.htaccess` exists in `public_html/`

### 3D. Test your website
- Visit **https://antaraalspace.com** — should load the homepage
- Navigate to Products, Vendors, etc. — should work
- Refresh the page on any route — should still work (thanks to .htaccess)

---

## STEP 4: Configure SSL (HTTPS)

GoDaddy usually provides free SSL. In cPanel:
1. Go to **"SSL/TLS Status"** or **"SSL/TLS"**
2. Enable/install SSL for `antaraalspace.com`
3. Or use **"Let's Encrypt"** if available

---

## Troubleshooting

### Pages show 404 on refresh
→ The `.htaccess` file is missing or not in `public_html/`. Re-upload it.

### API calls fail (CORS errors in console)
→ Check that the backend URL in `.env.production` is correct, then rebuild and re-upload.

### Backend is slow on first request
→ Render free tier sleeps after 15 minutes of inactivity. First request takes ~30 seconds to wake up. This is normal for the free plan. Upgrade to paid ($7/month) for always-on.

### Prisma `P1001` during startup on Render
→ Usually caused by using an external DB URL or DB cold start. Ensure `DATABASE_URL` uses Render's **Internal Database URL** (`*.render.internal`) and keep `npm run start:render`, which retries `prisma migrate deploy` with backoff.

### Database is empty
→ You need to seed it via Render Shell. See Step 1C.

---

## Updating the Website

### Frontend changes:
1. Make code changes locally
2. Run `npm run build`
3. Upload the new `dist/` contents to `public_html/` via cPanel File Manager (overwrite existing files)

### Backend changes:
1. Push changes to GitHub: `git add . && git commit -m "update" && git push`
2. Render will auto-deploy from GitHub

---

## Files Created for Deployment

| File | Purpose |
|------|---------|
| `.env.production` | Sets the backend API URL for the production build |
| `public/.htaccess` | Apache rewrite rules for SPA routing on cPanel |
| `backend/render.yaml` | Render.com blueprint (optional, for one-click deploy) |

## Cost Summary

| Service | Cost |
|---------|------|
| GoDaddy cPanel (your existing plan) | Already paid |
| Render.com Web Service (free tier) | $0/month |
| Render.com PostgreSQL (free tier) | $0/month |
| **Total additional cost** | **$0/month** |

> **Note**: Render free tier has limitations: the service sleeps after 15 min of inactivity (cold starts take ~30s), and the free PostgreSQL expires after 90 days (you'll need to recreate it or upgrade to $7/month Starter plan).
