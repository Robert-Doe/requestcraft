/*
 * server.js (the "bank")
 *
 * Module 09: CSRF via GET.
 *
 * This server is DELIBERATELY VULNERABLE. It simulates a tiny banking
 * app: visiting it auto-assigns a session cookie (standing in for "you
 * are already logged in" -- see DECISIONS.md #1), and /transfer moves
 * money between accounts -- using a plain GET request, authenticated
 * ONLY by whatever cookie the browser happens to attach. There is no
 * check that the transfer was actually intended by the user.
 *
 * This module needs TWO servers running at once: this one (the victim
 * site, port 8000) and node/attacker/server.js (an unrelated-looking
 * site, port 8001) whose whole job is to make your browser send a
 * request here without you knowing.
 *
 * Introduced in: Module 09.
 * Previous module's equivalent: node/server.js (Module 04) -- reuses
 * that module's core lesson (GET must not mutate state) but now shows
 * the attack arriving from a DIFFERENT origin, which is what makes this
 * CSRF specifically rather than just "an unsafe GET."
 * Prerequisite concepts: Module 04 (Idempotency & Safety).
 *
 * DO NOT copy this file's /transfer handler into real code.
 * Module 10 shows the POST + CSRF-token fix.
 */

'use strict';

const http = require('http');

const PORT = 8000;

// In-memory balances, keyed by a fake "session" identifier
const balances = { victim: 1000, attacker: 0 };

/*
 * parseCookies -- turns a raw Cookie header into a plain object.
 *
 * header: the raw value of the incoming Cookie header (may be undefined)
 * returns: an object of cookie name -> value
 */
function parseCookies(header) {
  const cookies = {};
  (header || '').split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    cookies[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  });
  return cookies;
}

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

const server = http.createServer((req, res) => {
  const [path, queryString = ''] = req.url.split('?');
  const cookies = parseCookies(req.headers.cookie);
  let session = cookies.session;

  if (!session) {
    // Simulate "you are already logged in" on first visit -- a real login
    // form is unrelated to this module's concept (see DECISIONS.md #1)
    session = 'victim';
    res.setHeader('Set-Cookie', 'session=victim; Path=/');
  }

  if (path === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 09 Bank</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 09 &mdash; "Bank" (victim site, port 8000)</h1>
  <p>Logged in as: <strong>${session}</strong></p>
  <p>Balance: <strong>$${balances[session] ?? 0}</strong></p>
  <p><a href="/balance">Refresh balance</a></p>
  <p style="color:#888">Now, in a NEW TAB, visit the attacker site at
  <a href="http://localhost:8001/">http://localhost:8001/</a> -- then come back here.</p>
</body></html>`);
    return;
  }

  if (path === '/balance' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<p>Balance for ${session}: $${balances[session] ?? 0}</p><p><a href="/">&larr; back</a></p>`);
    return;
  }

  if (path === '/transfer' && req.method === 'GET') {
    const params = parseFormEncoded(queryString);
    const to = params.to || 'attacker';
    const amount = parseInt(params.amount, 10) || 0;

    // THE VULNERABILITY: this state-changing transfer is authenticated
    // ONLY by the 'session' cookie the browser attaches automatically --
    // there is no check for WHERE the request came from, and no proof
    // the user meant to trigger it right now
    balances[session] = (balances[session] ?? 0) - amount;
    balances[to] = (balances[to] ?? 0) + amount;
    console.log(`[transfer] ${session} -> ${to}: $${amount} (GET request, cookie-authenticated only)`);

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Transferred $${amount} from ${session} to ${to}\n`);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 09 BANK (VULNERABLE ON PURPOSE) up on http://localhost:${PORT}`);
  console.log('Visit this first to get "logged in", then visit the attacker site on port 8001.\n');
});
