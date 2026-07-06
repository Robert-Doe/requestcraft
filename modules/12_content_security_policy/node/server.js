/*
 * server.js
 *
 * Module 12: Content Security Policy.
 *
 * This server reuses Module 05's exact vulnerable search page --
 * UNCHANGED, unescaped, still injectable -- on purpose. What changes is
 * the HTTP response header: three routes serve the IDENTICAL vulnerable
 * markup with three different Content-Security-Policy configurations,
 * so you can see CSP stop the attack independently of ever fixing the
 * underlying encoding bug -- and see it fail to help at all when
 * misconfigured with 'unsafe-inline'.
 *
 * Introduced in: Module 12.
 * Previous module's equivalent: node/server.js (Module 05) -- the
 * vulnerable page itself is identical; this module adds a response
 * header, nothing more.
 * Prerequisite concepts: Module 05 (Reflected XSS via GET), Module 11
 * (Output Encoding Defenses) -- you need to understand that CSP is a
 * SEPARATE, independent layer from encoding, not a replacement for it.
 *
 * DO NOT treat this file's /no-csp or /csp-unsafe-inline routes as safe.
 * Only /csp-strict demonstrates a real defense, and only in combination
 * with -- not instead of -- Module 11's fix.
 */

'use strict';

const http = require('http');

const PORT = 8000;

function parseFormEncoded(text) {
  const result = {};
  if (text === '') return result;
  for (const pair of text.split('&')) {
    const eqIndex = pair.indexOf('=');
    const rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
    const rawValue = eqIndex === -1 ? '' : pair.slice(eqIndex + 1);
    result[decodeURIComponent(rawKey.replace(/\+/g, ' '))] =
      decodeURIComponent(rawValue.replace(/\+/g, ' '));
  }
  return result;
}

/*
 * vulnerablePage -- IDENTICAL to Module 05's vulnerableSearchPage(). No
 * encoding, on purpose -- this module's lesson only lands if the
 * underlying bug is still genuinely present.
 */
function vulnerablePage(q) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 12</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 12 &mdash; CSP Demo</h1>
  <p>You searched for: ${q}</p>
  <p><a href="/">&larr; back</a></p>
</body></html>`;
}

function homePage() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 12</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 12 &mdash; Content Security Policy</h1>
  <p>Same vulnerable search, three different CSP headers. Try the Module 05
  payload against each route and compare what happens:</p>
  <ul>
    <li><a href="/no-csp?q=hello">/no-csp</a> -- no CSP header at all</li>
    <li><a href="/csp-strict?q=hello">/csp-strict</a> -- default-src 'self'; script-src 'self'</li>
    <li><a href="/csp-unsafe-inline?q=hello">/csp-unsafe-inline</a> -- adds 'unsafe-inline'</li>
  </ul>
</body></html>`;
}

const server = http.createServer((req, res) => {
  const [path, queryString = ''] = req.url.split('?');
  const params = parseFormEncoded(queryString);
  const q = params.q || '';

  if (path === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(homePage());
    return;
  }

  if (path === '/no-csp') {
    // No CSP header at all -- identical to Module 05, injected scripts run freely
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(vulnerablePage(q));
    return;
  }

  if (path === '/csp-strict') {
    // 'self' means "only scripts loaded from THIS origin" -- an inline
    // <script> block has no origin of its own, so it's blocked outright,
    // regardless of where its content came from
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'");
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(vulnerablePage(q));
    return;
  }

  if (path === '/csp-unsafe-inline') {
    // 'unsafe-inline' explicitly re-allows inline <script> blocks --
    // this is a common, real misconfiguration that quietly defeats the
    // entire XSS-mitigating purpose of CSP (see DECISIONS.md #2)
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'");
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(vulnerablePage(q));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 12 CSP demo up on http://localhost:${PORT}`);
});
