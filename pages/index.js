import { useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const PAGE_SIZE = 30;

// ── Utility ────────────────────────────────────────────────────
function scoreColor(s) {
  if (s >= 80) return '#16a34a';
  if (s >= 55) return '#d97706';
  return '#dc2626';
}
function scoreBg(s) {
  if (s >= 80) return '#f0fdf4';
  if (s >= 55) return '#fffbeb';
  return '#fef2f2';
}
function severityColor(sev) {
  if (sev === 'critical') return { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#dc2626' };
  if (sev === 'medium') return { bg: '#fffbeb', border: '#fed7aa', text: '#92400e', dot: '#d97706' };
  return { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', dot: '#16a34a' };
}
function statusPill(status) {
  if (status === 'indexed') return { bg: '#dcfce7', text: '#166534', label: '✓ Indexed' };
  if (status === 'not-indexed') return { bg: '#fee2e2', text: '#991b1b', label: '✗ Not Indexed' };
  return { bg: '#fef9c3', text: '#854d0e', label: '⚠ Verify' };
}
function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}
function downloadCSV(urls, siteUrl) {
  const header = 'URL,Status,Priority,Change Freq,Last Modified\n';
  const rows = urls.map(u =>
    `"${u.loc}","${u.status}","${u.priority || ''}","${u.changefreq || ''}","${u.lastmod || ''}"`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sitemap-audit-${new URL(siteUrl).hostname}-${Date.now()}.csv`;
  a.click();
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue} style={{ color }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

// ── Fix Card ───────────────────────────────────────────────────
function FixCard({ fix, index }) {
  const c = severityColor(fix.severity);
  return (
    <div className={styles.fixCard} style={{ background: c.bg, borderColor: c.border }}>
      <div className={styles.fixHeader}>
        <span className={styles.fixDot} style={{ background: c.dot }} />
        <span className={styles.fixSeverity} style={{ color: c.text }}>
          {fix.severity.toUpperCase()}
        </span>
        <span className={styles.fixNum}>#{index + 1}</span>
      </div>
      <div className={styles.fixTitle} style={{ color: c.text }}>{fix.title}</div>
      <div className={styles.fixDesc}>{fix.description}</div>
      <div className={styles.fixImpact}><strong>Impact:</strong> {fix.impact}</div>
    </div>
  );
}

// ── URL Table ──────────────────────────────────────────────────
function UrlTable({ urls, siteUrl }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = urls.filter(u => {
    if (filter !== 'all' && u.status !== filter) return false;
    if (search && !u.loc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const counts = {
    all: urls.length,
    indexed: urls.filter(u => u.status === 'indexed').length,
    'not-indexed': urls.filter(u => u.status === 'not-indexed').length,
    verify: urls.filter(u => u.status === 'verify').length,
  };

  const handleFilter = (f) => { setFilter(f); setPage(1); };
  const handleSearch = (v) => { setSearch(v); setPage(1); };

  return (
    <div className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <div className={styles.tableTitle}>URL Analysis</div>
        <button className={styles.csvBtn} onClick={() => downloadCSV(urls, siteUrl)}>
          ↓ Download Full CSV
        </button>
      </div>

      <div className={styles.tableControls}>
        <div className={styles.filterRow}>
          {[
            { key: 'all', label: 'All' },
            { key: 'indexed', label: '✓ Indexed' },
            { key: 'not-indexed', label: '✗ Not Indexed' },
            { key: 'verify', label: '⚠ Verify' },
          ].map(f => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
              onClick={() => handleFilter(f.key)}
            >
              {f.label}
              <span className={styles.filterCount}>{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className={styles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Search URLs..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.noResults}>No URLs match this filter.</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Change Freq</th>
                  <th>Last Modified</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((u, i) => {
                  const pill = statusPill(u.status);
                  return (
                    <tr key={u.loc + i}>
                      <td className={styles.tdNum}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td className={styles.tdUrl}>
                        <a href={u.loc} target="_blank" rel="noopener noreferrer" className={styles.urlLink}>
                          {u.loc}
                        </a>
                      </td>
                      <td>
                        <span className={styles.statusPill} style={{ background: pill.bg, color: pill.text }}>
                          {pill.label}
                        </span>
                      </td>
                      <td className={styles.tdMeta}>{u.priority || '—'}</td>
                      <td className={styles.tdMeta}>{u.changefreq || '—'}</td>
                      <td className={styles.tdMeta}>{formatDate(u.lastmod)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} URLs
            </span>
            <div className={styles.pageButtons}>
              <button
                className={styles.pageBtn}
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >← Prev</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page + i - 3;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                    onClick={() => setPage(p)}
                  >{p}</button>
                );
              })}
              <button
                className={styles.pageBtn}
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >Next →</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const steps = [
    'Normalizing URL...',
    'Checking robots.txt...',
    'Discovering sitemap...',
    'Fetching sitemap XML...',
    'Parsing URL entries...',
    'Analyzing indexing signals...',
    'Calculating health score...',
    'Generating audit report...',
  ];

  const runAudit = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a website URL.');
      inputRef.current?.focus();
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);

    // Cycle through loading steps visually
    let stepIdx = 0;
    setLoadStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setLoadStep(steps[stepIdx]);
    }, 900);

    try {
      const res = await fetch('/api/check-sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      clearInterval(stepInterval);

      if (!data.success) {
        setError(data.error || 'Audit failed. Please check the URL and try again.');
        setLoading(false);
        return;
      }

      setResult(data);
      setLoading(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      clearInterval(stepInterval);
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }, [url]);

  const handleKey = (e) => { if (e.key === 'Enter') runAudit(); };

  const criticalCount = result?.fixes?.filter(f => f.severity === 'critical').length || 0;

  return (
    <>
      <Head>
        <title>XML Sitemap Audit Tool — Free SEO Indexing Analysis</title>
        <meta name="description" content="Enter your website URL and instantly audit your sitemap health, indexing signals, and technical SEO issues. Free, no login required." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.page}>

        {/* ── NAV ── */}
        <nav className={styles.nav}>
          <div className={styles.navInner}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>◈</span>
              <span className={styles.logoText}>SitemapAudit</span>
            </div>
            <div className={styles.navLinks}>
              <a href="#tool" className={styles.navLink}>Free Audit</a>
              <a href="#how" className={styles.navLink}>How It Works</a>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroBadge}>Free Tool · No Login Required</div>
            <h1 className={styles.heroH1}>
              XML Sitemap<br />
              <span className={styles.heroAccent}>SEO Audit Tool</span>
            </h1>
            <p className={styles.heroSub}>
              Enter your website URL and instantly check sitemap health,<br className={styles.br} />
              indexing signals, and technical SEO issues.
            </p>
            <div className={styles.trustRow}>
              {['No login', 'Instant report', 'Downloadable CSV', 'Beginner friendly'].map(t => (
                <span key={t} className={styles.trustItem}>
                  <span className={styles.trustCheck}>✓</span> {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── AUDIT TOOL ── */}
        <section className={styles.toolSection} id="tool">
          <div className={styles.toolCard}>
            <div className={styles.toolHeader}>
              <h2 className={styles.toolTitle}>Run Free Sitemap Audit</h2>
              <p className={styles.toolSub}>We automatically detect your sitemap — no technical knowledge needed.</p>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.inputWrap}>
                <div className={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    <path d="M2 12h20" />
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  className={styles.urlInput}
                  type="text"
                  placeholder="https://example.com"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError(''); }}
                  onKeyDown={handleKey}
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                />
                {url && (
                  <button className={styles.inputClear} onClick={() => { setUrl(''); setError(''); inputRef.current?.focus(); }}>
                    ✕
                  </button>
                )}
              </div>
              <button
                className={styles.auditBtn}
                onClick={runAudit}
                disabled={loading}
              >
                {loading ? (
                  <span className={styles.btnLoading}>
                    <span className={styles.spinner} />
                    Auditing...
                  </span>
                ) : 'Run Free Audit →'}
              </button>
            </div>

            {error && (
              <div className={styles.errorBox}>
                <span className={styles.errorIcon}>⚠</span>
                {error}
              </div>
            )}

            {!loading && !result && (
              <div className={styles.scanNote}>
                <span className={styles.scanNoteIcon}>🔍</span>
                Will automatically scan: <code>/sitemap.xml</code>, <code>/sitemap_index.xml</code>, <code>/robots.txt</code> and more
              </div>
            )}

            {loading && (
              <div className={styles.loadingCard}>
                <div className={styles.loadingDots}>
                  <span /><span /><span />
                </div>
                <div className={styles.loadingStep}>{loadStep}</div>
                <div className={styles.loadingBar}>
                  <div className={styles.loadingFill} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── RESULTS ── */}
        {result && (
          <section className={styles.results} ref={resultsRef}>
            <div className={styles.resultsInner}>

              {/* Report header */}
              <div className={styles.reportHeader}>
                <div className={styles.reportMeta}>
                  <div className={styles.reportSite}>{result.origin}</div>
                  <div className={styles.reportDetails}>
                    <span className={styles.reportTag}>Sitemap: <a href={result.sitemapUrl} target="_blank" rel="noopener noreferrer" className={styles.sitemapLink}>{result.sitemapUrl}</a></span>
                    <span className={styles.reportTag}>Type: {result.sitemapType === 'sitemapindex' ? `Sitemap Index (${result.totalChildSitemaps} child sitemaps)` : 'URL Set'}</span>
                    <span className={styles.reportTag}>Audited: {formatDate(result.auditedAt)}</span>
                  </div>
                </div>
                <div className={styles.scoreBlock} style={{ background: scoreBg(result.score) }}>
                  <div className={styles.scoreNum} style={{ color: scoreColor(result.score) }}>
                    {result.score}
                  </div>
                  <div className={styles.scoreDenom}>/100</div>
                  <div className={styles.scoreLabel} style={{ color: scoreColor(result.score) }}>
                    {result.scoreLabel}
                  </div>
                </div>
              </div>

              {/* Stat cards */}
              <div className={styles.statsGrid}>
                <StatCard label="Total URLs" value={result.stats.total.toLocaleString()} color="#1d4ed8" />
                <StatCard label="Indexed" value={result.stats.indexed.toLocaleString()} color="#16a34a" sub={`${Math.round((result.stats.indexed / result.stats.total) * 100)}% of total`} />
                <StatCard label="Not Indexed" value={result.stats.notIndexed.toLocaleString()} color="#dc2626" />
                <StatCard label="Verify" value={result.stats.verify.toLocaleString()} color="#d97706" />
                <StatCard label="Issues Found" value={result.issues.httpInsideHttps + result.issues.duplicates} color="#7c3aed" />
                <StatCard label="Missing Lastmod" value={result.issues.missingLastmod.toLocaleString()} color="#6b7280" />
                <StatCard label="Duplicate URLs" value={result.issues.duplicates.toLocaleString()} color="#dc2626" />
                <StatCard label="HTTP in HTTPS" value={result.issues.httpInsideHttps.toLocaleString()} color="#dc2626" />
              </div>

              {/* Priority fixes */}
              {result.fixes.length > 0 && (
                <div className={styles.fixesSection}>
                  <div className={styles.fixesHeader}>
                    <h3 className={styles.fixesTitle}>Priority Fixes</h3>
                    {criticalCount > 0 && (
                      <span className={styles.criticalBadge}>{criticalCount} Critical</span>
                    )}
                  </div>
                  <div className={styles.fixesGrid}>
                    {result.fixes.map((fix, i) => (
                      <FixCard key={i} fix={fix} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* URL Table */}
              <UrlTable urls={result.urls} siteUrl={result.sitemapUrl} />

              {/* Final CTA */}
              <div className={styles.ctaSection}>
                <div className={styles.ctaCard}>
                  <div className={styles.ctaIcon}>📋</div>
                  <div className={styles.ctaContent}>
                    <h3 className={styles.ctaTitle}>Need a Deeper SEO Audit?</h3>
                    <p className={styles.ctaText}>
                      This tool covers sitemap health and indexing signals. For a full technical SEO audit
                      including crawl errors, Core Web Vitals, on-page analysis, and backlink profile — get a professional report.
                    </p>
                  </div>
                  <a href="mailto:contact@example.com?subject=Full SEO Audit Request" className={styles.ctaBtn}>
                    Request Full Technical Audit →
                  </a>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ── HOW IT WORKS ── */}
        {!result && (
          <section className={styles.howSection} id="how">
            <div className={styles.howInner}>
              <h2 className={styles.howTitle}>How It Works</h2>
              <div className={styles.howGrid}>
                {[
                  { n: '1', title: 'Enter Your URL', desc: 'Just paste your website URL. No sitemap URL needed — we find it automatically.' },
                  { n: '2', title: 'Auto Detection', desc: 'We check robots.txt, try 7+ common sitemap paths, and handle sitemap indexes automatically.' },
                  { n: '3', title: 'Instant Analysis', desc: 'Every URL is classified for indexability, issues are detected, and a health score is calculated.' },
                  { n: '4', title: 'Download Report', desc: 'Get a prioritized list of fixes and download a full CSV report with all URL data.' },
                ].map(s => (
                  <div key={s.n} className={styles.howCard}>
                    <div className={styles.howNum}>{s.n}</div>
                    <h3 className={styles.howCardTitle}>{s.title}</h3>
                    <p className={styles.howCardDesc}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER ── */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerLogo}>
              <span className={styles.logoIcon}>◈</span>
              <span className={styles.logoText}>SitemapAudit</span>
            </div>
            <div className={styles.footerText}>
              Free XML Sitemap SEO Audit Tool · No login required · Built for SEO professionals
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
