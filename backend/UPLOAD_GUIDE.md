# GoDaddy Deployment - What to Upload

This file documents EXACTLY what should be uploaded to GoDaddy to stay under 100MB.

## ✅ Files TO Upload (Required)

```
backend/
├── dist/                 ← BUILD LOCALLY FIRST! (npm run build)
│   └── **/*.js          ← All compiled JavaScript files
├── prisma/
│   ├── schema.prisma    ← Required for Prisma
│   └── seed.ts          ← For database seeding (optional)
├── package.json         ← Dependencies list
├── package-lock.json    ← Dependency lock file
└── .env                 ← CREATE ON SERVER (don't upload your local one!)
```

## ❌ Files NOT to Upload (Excluded)

- ❌ `node_modules/` - Installed by GoDaddy via npm install
- ❌ `.git/` - Version control (not needed)
- ❌ `src/` - TypeScript source (not needed, you upload compiled `dist/`)
- ❌ `.env` - Local environment (create fresh on server)
- ❌ `uploads/` - Create empty folder on server
- ❌ `*.md` - Documentation files
- ❌ `prisma/migrations/` - Use `prisma db push` instead
- ❌ Development files (.vscode, .idea, etc.)

## 📦 Recommended Upload Method

### Option 1: Build Locally, Upload dist/
```bash
# 1. Build locally
cd backend
npm install
npm run build

# 2. Create a zip with only required files
# Upload: dist/, prisma/, package.json, package-lock.json
# Size: ~5-10 MB (much smaller than 100 MB limit)
```

### Option 2: Use File Manager
1. Upload via cPanel File Manager
2. Upload folders: `dist/`, `prisma/`
3. Upload files: `package.json`, `package-lock.json`
4. Total upload: < 10 MB

## 🔢 Size Estimates

- `dist/` folder: ~2-5 MB (compiled JS)
- `prisma/` folder: < 1 MB (schema + seed)
- `package.json` + lock: < 1 MB
- **Total**: ~5-10 MB ✅ Well under 100 MB limit

## ⚠️ Important Notes

1. **Build before upload**: Always run `npm run build` locally first
2. **Don't upload node_modules**: GoDaddy installs via npm install
3. **Don't upload src/**: Only compiled code in `dist/` is needed
4. **.env on server**: Create fresh .env on server with GoDaddy credentials
5. **Empty uploads/ folder**: Create manually on server, don't upload local uploads

## 🚀 Quick Upload Checklist

- [ ] Run `npm run build` locally
- [ ] Verify `dist/` folder exists and has compiled .js files
- [ ] Create zip with: `dist/`, `prisma/schema.prisma`, `package.json`, `package-lock.json`
- [ ] Verify zip size < 20 MB
- [ ] Upload to GoDaddy via File Manager
- [ ] Create `.env` on server
- [ ] Run "NPM Install" in GoDaddy Node.js App manager
- [ ] Run Prisma commands via SSH
- [ ] Restart app
