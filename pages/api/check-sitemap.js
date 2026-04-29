/**
 * /api/check-sitemap
 * Next.js API Route — server-side sitemap audit
 * No CORS issues. Runs entirely on Vercel serverless.
 */

import { runSitemapAudit } from '../../lib/sitemapEngine';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url in request body' });
  }

  try {
    const result = await runSitemapAudit(url);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[check-sitemap]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Audit failed. Please try again.',
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
