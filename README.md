# XML Sitemap Audit Tool

Premium SEO SaaS tool — enter any website URL and get an instant, professional sitemap indexing audit. Built with Next.js + Vercel.

## Tech Stack

- **Framework:** Next.js 14 (Pages Router)
- **Hosting:** Vercel (free tier)
- **Backend:** Next.js API Routes (no CORS issues)
- **Styling:** CSS Modules
- **AI / Paid APIs:** None — 100% free

## Project Structure

```
xmlaudit/
├── lib/
│   └── sitemapEngine.js     ← Core audit engine (detection, parsing, analysis)
├── pages/
│   ├── _app.js
│   ├── _document.js
│   ├── index.js             ← Main product page
│   └── api/
│       └── check-sitemap.js ← Backend API route
├── styles/
│   ├── globals.css
│   └── Home.module.css      ← Premium design
├── public/
├── next.config.js
├── vercel.json
└── package.json
```

## Deploy to Vercel (5 minutes)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/xml-sitemap-audit.git
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** — done in ~60 seconds

No environment variables needed. No API keys. It just works.

### Local Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Features

- ✅ Auto sitemap detection (robots.txt + 7 path patterns)
- ✅ Handles sitemap index files (merges child sitemaps)
- ✅ URL classification (indexed / not-indexed / verify)
- ✅ Issue detection (duplicate URLs, HTTP in HTTPS, missing lastmod)
- ✅ Health score (0–100)
- ✅ Prioritized fixes (critical / medium / low)
- ✅ Paginated URL table (30/page) with filters + search
- ✅ Full CSV export
- ✅ Mobile responsive
- ✅ Zero paid APIs
