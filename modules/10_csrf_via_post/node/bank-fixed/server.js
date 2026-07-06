/*
 * server.js (the "bank" -- FIXED: CSRF token + SameSite cookie)
 *
 * Module 10: CSRF via POST.
 *
 * This is the real fix, layered two ways on purpose:
 *
 *   1. A per-session CSRF token is generated on GET / and embedded as a
 *      hidden field in the legitimate transfer form. /transfer rejects
 *      any request whose submitted token doesn't match the session's
 *      expected token. The attacker's forged form (in node/attacker)
 *      has no way to know this token -- it's random, per-session, and
 *      never exposed anywhere the attacker's page could read it.
 *
 *   2. The session cookie is set with `SameSite=Strict`, which tells the
 *      browser itself: never attach this cookie to a request that
 *      originated from a different site, full stop -- regardless of
 *      whether it's a GET, a POST, an <img>, or a <form>. This is a
 *      SECOND, INDEPENDENT layer: even if the token check had a bug,
 *      SameSite=Strict means the attacker's forged POST wouldn't even
 *      arrive with a session cookie attached, so there'd be no session
 *      to attack in the first place.
 *
 * Introduced in: Module 10.
 * Previous module's equivalent: node/bank-vulnerable/server.js (this
 * module) -- same balances/session pattern, with both defenses added.
 * Prerequisite concepts: Module 09 (CSRF via GET), and this module's
 * own bank-vulnerable/server.js (read that one first to see what it's missing).
 */

'use strict';

const http = require('http');
const crypto = require('crypto');

const PORT = 8000;
const MAX_BODY_BYTES = 1_000_000;
const balances = { victim: 1000, attacker: 0 };
const csrfTokens = {}; // session -> expected token, server-side only -- never guessable from outside

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

function readBody(req) {
  return new Promise((resolve, reject) => {
    let received = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      received += chunk.length;
      if (received > MAX_BODY_BYTES) { req.destroy(); reject(new Error('Body too large')); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  const cookies = parseCookies(req.headers.cookie);
  let session = cookies.session;

  if (!session) {
    session = 'victim';
    // SameSite=Strict is DEFENSE #2 -- the browser itself will refuse to
    // attach this cookie to any cross-site request, no matter the method
    res.setHeader('Set-Cookie', 'session=victim; Path=/; SameSite=Strict');
  }

  if (!csrfTokens[session]) {
    // Random, unguessable, per-session -- DEFENSE #1
    csrfTokens[session] = crypto.randomBytes(16).toString('hex');
  }

  if (path === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 10 Bank (fixed)</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 10 &mdash; "Bank" (FIXED: CSRF token + SameSite)</h1>
  <p>Logged in as: <strong>${session}</strong> &mdash; Balance: <strong>$${balances[session] ?? 0}</strong></p>
  <form method="post" action="/transfer">
    <input type="hidden" name="to" value="someone-else">
    <input type="hidden" name="csrf_token" value="${csrfTokens[session]}">
    <input name="amount" value="10">
    <button type="submit">Send legitimate transfer</button>
  </form>
  <p><a href="/balance">Refresh balance</a> &middot; now visit <a href="http://localhost:8001/">http://localhost:8001/</a></p>
</body></html>`);
    return;
  }

  if (path === '/balance' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<p>Balance for ${session}: $${balances[session] ?? 0}</p><p><a href="/">&larr; back</a></p>`);
    return;
  }

  if (path === '/transfer') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('405 Method Not Allowed\n');
      return;
    }
    const body = await readBody(req);
    const params = parseFormEncoded(body);

    // DEFENSE #1 in action: reject unless the submitted token matches
    // exactly what this session was issued -- the attacker's forged form
    // has no legitimate way to know this value
    if (params.csrf_token !== csrfTokens[session]) {
      console.log(`[transfer] REJECTED -- csrf_token mismatch (got ${JSON.stringify(params.csrf_token)})`);
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden -- missing or invalid CSRF token\n');
      return;
    }

    const to = params.to || 'attacker';
    const amount = parseInt(params.amount, 10) || 0;
    balances[session] = (balances[session] ?? 0) - amount;
    balances[to] = (balances[to] ?? 0) + amount;
    console.log(`[transfer] ${session} -> ${to}: $${amount} (valid CSRF token)`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Transferred $${amount} from ${session} to ${to}\n`);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 10 BANK -- FIXED (CSRF token + SameSite=Strict) up on http://localhost:${PORT}`);
});
