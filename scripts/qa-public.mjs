/** Read-only production smoke test. No form submissions, no authentication. */
const base = (process.env.SITE_URL || 'https://aigen-comms.vercel.app').replace(/\/$/, '');
const checks = [
  ['홈', '/', 'html'],
  ['포트폴리오', '/projects', 'html'],
  ['견적', '/quote', 'html'],
  ['robots', '/robots.txt', 'robots'],
  ['sitemap', '/sitemap.xml', 'sitemap'],
];
let failed = 0;
for (const [label, path, type] of checks) {
  try {
    const response = await fetch(base + path, { redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'user-agent': 'AIGEN-QA/1.0' } });
    const body = await response.text();
    const ok = response.ok && (
      type === 'html' ? /<html\b/i.test(body) && /<title\b/i.test(body) && /<meta[^>]+name=["']description["']/i.test(body) :
      type === 'robots' ? /User-agent:/i.test(body) && /Sitemap:/i.test(body) :
      /<urlset\b/i.test(body) && !/example\.com/i.test(body)
    );
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${response.status} ${response.url}`);
    if (!ok) failed++;
    if (type === 'robots' && /Disallow:\s*\/admin/i.test(body) === false) { console.error('FAIL robots admin exclusion'); failed++; }
  } catch (error) { console.error(`FAIL ${label}: ${error.message}`); failed++; }
}
console.log(`\nRead-only smoke test: ${checks.length} routes; ${failed} failures. Does not test admin login, R2 or inquiry submission.`);
process.exitCode = failed ? 1 : 0;
