/**
 * /api/analyze — Vercel Serverless Function
 *
 * Proxies AI analysis requests to Groq (or other providers).
 * The API key lives ONLY in Vercel environment variables — never in the browser.
 *
 * Environment variables to set in Vercel dashboard:
 *   GROQ_API_KEY       → your Groq key  (gsk_...)
 *   GEMINI_API_KEY     → your Gemini key (AIza...)
 *   OPENROUTER_API_KEY → your OpenRouter key (sk-or-...)
 */

export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { provider = 'groq', prompt, userKey } = body;

  if (!prompt) return json({ error: 'Missing prompt' }, 400);

  try {
    let result;

    if (provider === 'groq') {
      // User key overrides env key — if neither exists, error gracefully
      const key = userKey || process.env.GROQ_API_KEY;
      if (!key) return json({ error: 'GROQ_API_KEY not configured' }, 500);
      result = await callGroq(key, prompt);

    } else if (provider === 'gemini') {
      const key = userKey || process.env.GEMINI_API_KEY;
      if (!key) return json({ error: 'GEMINI_API_KEY not configured' }, 500);
      result = await callGemini(key, prompt);

    } else if (provider === 'openrouter') {
      const key = userKey || process.env.OPENROUTER_API_KEY;
      if (!key) return json({ error: 'OPENROUTER_API_KEY not configured' }, 500);
      result = await callOpenRouter(key, prompt);

    } else {
      return json({ error: `Unknown provider: ${provider}` }, 400);
    }

    return json({ result });

  } catch (err) {
    console.error('[analyze]', err);
    return json({ error: err.message || 'AI request failed' }, 502);
  }
}

// ── Provider calls ──────────────────────────────────────────

async function callGroq(key, prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 900,
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Groq API error');
  return data.choices[0].message.content;
}

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
  if (!res.ok) throw new Error(data.error?.message || 'Gemini API error');
  return data.candidates[0].content.parts[0].text;
}

async function callOpenRouter(key, prompt) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
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
  if (!res.ok) throw new Error(data.error?.message || 'OpenRouter error');
  return data.choices[0].message.content;
}

// ── Helpers ──────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
