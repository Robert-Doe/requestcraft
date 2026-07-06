/*
 * server.js
 *
 * Module 05: Reflected XSS via GET.
 *
 * This server is DELIBERATELY VULNERABLE. The /search route takes the
 * ?q= value straight out of the URL and drops it into the HTML response
 * with plain string interpolation -- no escaping, no encoding, nothing.
 * Whatever the URL says becomes part of the page verbatim, including
 * HTML tags. This is the single most common shape of a reflected XSS
 * bug: "search results" pages that echo the search term back to you.
 *
 * Introduced in: Module 05.
 * Previous module's equivalent: node/server.js (Module 04) -- reuses
 * the same parseFormEncoded() helper; the NEW code is the vulnerable
 * echo itself.
 * Prerequisite concepts: Module 04 (Idempotency & Safety) -- you must
 * already know that a plain GET URL can be triggered with zero user
 * confirmation, because that's exactly how this module's payload gets
 * delivered to a victim (a link, not a form).
 *
 * DO NOT copy this file's /search handler into real code. Module 11
 * (Output Encoding Defenses) comes back and fixes this exact file.
 */

'use strict';

const http = require('http');

const PORT = 8000;

// --- reused verbatim from earlier modules ---
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
// --- end reused block ---

function homePage() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 05</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 05 &mdash; Reflected XSS via GET</h1>
  <form method="get" action="/search">
    <input name="q" placeholder="search term" size="40">
    <button type="submit">Search</button>
  </form>
  <p>Try a normal search first. Then read the tutorial and try the payload URL.</p>
</body></html>`;
}

/*
 * vulnerableSearchPage -- builds the search results page.
 *
 * q: the raw, attacker-controllable value straight from ?q= in the URL
 * returns: a full HTML document string
 *
 * THIS FUNCTION IS THE VULNERABILITY. It drops `q` directly into the
 * HTML via a template literal, with no call to any encoding function.
 * If `q` contains "<script>...</script>", that script tag becomes real,
 * executable markup in the page the browser renders -- the browser has
 * no way to tell "text the user searched for" apart from "markup the
 * server meant to send," because by the time it reaches the browser,
 * both look identical: just bytes of HTML.
 */
function vulnerableSearchPage(q) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Search results</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Search results</h1>
  <p>You searched for: ${q}</p>
  <p><a href="/">&larr; back</a></p>
</body></html>`;
}

const server = http.createServer((req, res) => {
  const [path, queryString = ''] = req.url.split('?');
  const getParams = parseFormEncoded(queryString);

  if (path === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(homePage());
    return;
  }

  if (path === '/search' && req.method === 'GET') {
    const q = getParams.q || '';
    console.log(`[search] rendering page with raw, unescaped q = ${JSON.stringify(q)}`);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(vulnerableSearchPage(q));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 05 (VULNERABLE ON PURPOSE) demo up on http://localhost:${PORT}`);
  console.log('Try: http://localhost:8000/search?q=hello');
  console.log('Then try the payload URL from the tutorial.\n');
});
