# SitemapScan 🔍
**Free SEO Sitemap Indexing Audit Tool — powered by AI**

Paste any sitemap XML and instantly see which pages are indexed on Google, with AI expert analysis. No login, no paywall.

---

## 🚀 Deploy to Vercel (5 minutes)

### Step 1 — Push to GitHub
```bash
# In this folder:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sitemapscan.git
git push -u origin main
```

### Step 2 — Import to Vercel
1. Go to **[vercel.com](https://vercel.com)** → Log in / Sign up (free)
2. Click **"Add New Project"**
3. Import your GitHub repo **sitemapscan**
4. Leave all build settings as-is (Vercel auto-detects)
5. Click **"Deploy"** — wait ~30 seconds

### Step 3 — Add Environment Variables (API Keys)
1. In Vercel dashboard → your project → **Settings → Environment Variables**
2. Add these one by one:

| Variable Name       | Value                  | Where to get it (free)              |
|---------------------|------------------------|--------------------------------------|
| `GROQ_API_KEY`      | `gsk_your_key_here`    | [console.groq.com](https://console.groq.com) — no credit card |
| `GEMINI_API_KEY`    | `AIza_your_key_here`   | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `OPENROUTER_API_KEY`| `sk-or-your_key_here`  | [openrouter.ai/keys](https://openrouter.ai/keys) |

> ⚠️ Set Environment = **Production, Preview, Development** for all three.

### Step 4 — Redeploy
After adding env vars:
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment → **Redeploy**
3. Your site is now live at `https://your-project.vercel.app` 🎉

---

## 🏗️ Project Structure

```
sitemapscan/
├── public/
│   └── index.html        ← Frontend (HTML/CSS/JS — zero secrets)
├── api/
│   └── analyze.js        ← Vercel Edge Function (holds API keys securely)
├── vercel.json           ← Vercel routing config
├── .env.example          ← Template for environment variables
├── .gitignore            ← Keeps .env out of git
└── README.md
```

## 🔒 Security Architecture

```
Browser                    Vercel Edge              AI Provider
──────────                 ────────────             ───────────
User pastes XML    ──►    /api/analyze.js   ──►    Groq / Gemini
                          (reads GROQ_API_KEY        (returns analysis)
No key in HTML ✅          from env vars)    ◄──
                   ◄──    Returns result
```

- **API keys never appear in the browser or frontend code**
- Keys are stored encrypted in Vercel's environment variable system
- Users can optionally provide their own key (passed securely through the proxy)
- Ollama calls go direct (local machine only — fully private)

---

## 🔧 Local Development

```bash
npm install -g vercel

# Create local env file (never commit this)
cp .env.example .env.local
# Fill in your keys in .env.local

# Run locally with Vercel dev (loads env vars automatically)
vercel dev
```

Open `http://localhost:3000`

---

## 📦 Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS — no build step, zero dependencies
- **Backend:** Vercel Edge Functions (Node.js-compatible, deployed globally)
- **AI:** Groq (default), Gemini, OpenRouter, Ollama (local)
- **Hosting:** Vercel free tier (100GB bandwidth/month)

---

## ✏️ Customizing

**Change default AI provider:** Edit `api/analyze.js` — modify the `provider` default check.

**Add your own branding:** Edit `public/index.html` — update the masthead title, colors (CSS vars at top), or description.

**Add more providers:** Add a new `else if (provider === 'yourprovider')` block in `api/analyze.js` and a corresponding card in the frontend.
