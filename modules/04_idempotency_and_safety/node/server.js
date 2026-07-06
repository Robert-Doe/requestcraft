/*
 * server.js
 *
 * Module 04: Idempotency & Safety.
 *
 * Runs two counters side by side: one incremented by a plain GET
 * request (the "unsafe" counter -- unsafe because GET is supposed to
 * be safe to fetch with no side effects, per RFC 7231), and one that
 * only accepts POST (the "safe" counter). A hidden <img> tag embedded
 * in the page fetches the unsafe counter's URL automatically, the
 * moment the page loads -- simulating a link-preview bot, an antivirus
 * URL scanner, or a browser's predictive prefetch, none of which ask
 * permission before issuing a GET.
 *
 * Introduced in: Module 04.
 * Previous module's equivalent: node/server.js (Module 03) -- reuses
 * its readBody()/parseFormEncoded() pattern conceptually, though this
 * module's routes don't need to parse a body at all.
 * Prerequisite concepts: Module 03 (Forms & Method Semantics) -- you
 * must already know that a plain <a href> and a hidden <img src> both
 * produce a GET request with no user confirmation step.
 */

'use strict';

const http = require('http');

const PORT = 8000;

// In-memory counters -- this works because Node keeps ONE process alive
// for the whole server's lifetime (see DECISIONS.md #1 for why PHP's
// built-in server can't do the same thing without extra work)
let unsafeCount = 0;
let safeCount = 0;

function page() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 04</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 04 &mdash; Idempotency &amp; Safety</h1>

  <h2>Unsafe counter (GET-triggered): <span id="unsafe">${unsafeCount}</span></h2>
  <p><a href="/unsafe-increment">Click to increment (GET)</a></p>
  <!-- This hidden image fires a real GET request the instant this page loads,
       with zero clicks -- exactly what a link-preview bot or prefetcher does -->
  <img src="/unsafe-increment" style="display:none" alt="">

  <h2>Safe counter (POST-only): <span id="safe">${safeCount}</span></h2>
  <form method="post" action="/safe-increment">
    <button type="submit">Increment (POST)</button>
  </form>
  <!-- Same trick attempted against the safe endpoint -- it will NOT increment,
       because /safe-increment refuses anything that isn't POST -->
  <img src="/safe-increment" style="display:none" alt="">

  <p><a href="/">&#8635; reload to see current counts</a></p>
</body></html>`;
}

const server = http.createServer((req, res) => {
  const path = req.url.split('?')[0];

  if (path === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page());
    return;
  }

  if (path === '/unsafe-increment' && req.method === 'GET') {
    unsafeCount += 1; // the entire bug lives in this one line responding to GET
    console.log(`[unsafe-increment] now ${unsafeCount} (triggered by a GET request)`);
    // Redirect back to '/' rather than returning JSON -- this lets the exact
    // same endpoint serve both a real link click (full navigation) and the
    // hidden <img> tag (which will just show a broken-image icon, but the
    // GET request -- and the increment -- already happened either way)
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  if (path === '/safe-increment') {
    if (req.method !== 'POST') {
      // Fail loudly on purpose -- silently ignoring the GET would hide the
      // contrast this module exists to demonstrate
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('405 Method Not Allowed -- this endpoint only accepts POST, on purpose (see Module 04)\n');
      return;
    }
    safeCount += 1;
    console.log(`[safe-increment] now ${safeCount} (triggered by a POST request)`);
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 04 demo up on http://localhost:${PORT}`);
  console.log('Open it in a browser, reload it a few times, and watch the unsafe counter climb on its own.');
  console.log('Then run: node crawler.js   (from this module\'s root, not from node/)\n');
});
