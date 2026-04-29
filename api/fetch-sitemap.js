/**
 * /api/fetch-sitemap.js — Vercel Serverless Function
 *
 * Fetches a sitemap XML from any URL server-side,
 * bypassing browser CORS restrictions entirely.
 * Tries multiple sitemap URL patterns automatically.
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing url' });

  // Normalise URL
  url = url.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  // Sitemap candidates to try in order
  const candidates = [
    url + '/sitemap.xml',
    url + '/sitemap_index.xml',
    url + '/sitemap-index.xml',
    url + '/sitemap/',
    url + '/sitemaps/sitemap.xml',
    url + '/wp-sitemap.xml',          // WordPress
    url + '/news-sitemap.xml',
  ];

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; SitemapScanner/1.0)',
    'Accept': 'application/xml, text/xml, */*',
  };

  // First try robots.txt to discover the real sitemap URL
  try {
    const robotsRes = await fetch(url + '/robots.txt', { headers: HEADERS, redirect: 'follow' });
    if (robotsRes.ok) {
      const robotsTxt = await robotsRes.text();
      const matches = [...robotsTxt.matchAll(/^Sitemap:\s*(.+)$/gim)];
      if (matches.length > 0) {
        // Prepend robots.txt-declared sitemaps — most authoritative
        const robotsSitemaps = matches.map(m => m[1].trim());
        candidates.unshift(...robotsSitemaps);
      }
    }
  } catch (_) { /* robots.txt optional */ }

  // Try each candidate
  const tried = [];
  for (const candidate of candidates) {
    try {
      tried.push(candidate);
      const response = await fetch(candidate, {
        headers: HEADERS,
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      // Validate it looks like XML sitemap
      if (
        text.includes('<urlset') ||
        text.includes('<sitemapindex') ||
        text.includes('<url>') ||
        text.includes('<sitemap>')
      ) {
        // If it's a sitemap index, fetch the first child sitemap too
        if (text.includes('<sitemapindex')) {
          const childUrls = [...text.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi)]
            .map(m => m[1])
            .filter(u => u.includes('sitemap'));

          // Try to fetch and merge first few child sitemaps (up to 3)
          let mergedUrls = '';
          for (const childUrl of childUrls.slice(0, 3)) {
            try {
              const childRes = await fetch(childUrl, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(6000) });
              if (childRes.ok) {
                const childText = await childRes.text();
                // Extract <url> blocks
                const urlBlocks = [...childText.matchAll(/<url>[\s\S]*?<\/url>/gi)].map(m => m[0]);
                mergedUrls += urlBlocks.join('\n');
              }
            } catch (_) { /* skip failed child */ }
          }

          if (mergedUrls) {
            const merged = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${mergedUrls}
</urlset>`;
            return res.status(200).json({
              xml: merged,
              source: candidate,
              type: 'sitemap-index-merged',
              childCount: childUrls.length,
            });
          }
        }

        return res.status(200).json({
          xml: text,
          source: candidate,
          type: text.includes('<sitemapindex') ? 'sitemap-index' : 'urlset',
        });
      }
    } catch (err) {
      // Timeout or network error — try next
      continue;
    }
  }

  return res.status(404).json({
    error: `No sitemap found for ${url}`,
    tried,
    suggestion: 'Try entering the direct sitemap URL, or paste the XML manually.',
  });
};
