/**
 * /api/analyze.js — Vercel Serverless Function (Node.js)
 *
 * Proxies AI requests server-side so API keys never appear in the browser.
 *
 * Set these in Vercel Dashboard → Project → Settings → Environment Variables:
 *   GROQ_API_KEY        → gsk_...
 *   GEMINI_API_KEY      → AIza...  (optional)
 *   OPENROUTER_API_KEY  → sk-or-... (optional)
 */

module.exports = async function handler(req, res) {
  // CORS headers — allow any origin (public tool)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider = 'groq', prompt, userKey } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    let result;

    if (provider === 'groq') {
      const key = userKey || process.env.GROQ_API_KEY;
      if (!key) return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
      result = await callGroq(key, prompt);

    } else if (provider === 'gemini') {
      const key = userKey || process.env.GEMINI_API_KEY;
      if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
      result = await callGemini(key, prompt);

    } else if (provider === 'openrouter') {
      const key = userKey || process.env.OPENROUTER_API_KEY;
      if (!key) return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured on server' });
      result = await callOpenRouter(key, prompt);

    } else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    return res.status(200).json({ result });

  } catch (err) {
    console.error('[analyze error]', err.message);
    return res.status(502).json({ error: err.message || 'AI request failed' });
  }
};

// ── Groq ─────────────────────────────────────────────────────
async function callGroq(key, prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 900,
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Groq error ${res.status}`);
  return data.choices[0].message.content;
}

// ── Gemini ───────────────────────────────────────────────────
async function callGemini(key, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Gemini error ${res.status}`);
  return data.candidates[0].content.parts[0].text;
}

// ── OpenRouter ───────────────────────────────────────────────
async function callOpenRouter(key, prompt) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://sitemapscan.vercel.app',
      'X-Title': 'SitemapScan',
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 900,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `OpenRouter error ${res.status}`);
  return data.choices[0].message.content;
}
