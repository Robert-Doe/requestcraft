/*
 * server.js (the "bank" -- naive POST-only fix, STILL VULNERABLE)
 *
 * Module 10: CSRF via POST.
 *
 * This server represents the "obvious fix" to Module 09: move /transfer
 * from GET to POST. It is STILL DELIBERATELY VULNERABLE, because POST
 * alone does not stop a forged request -- it only stops the SIMPLEST
 * delivery mechanism (a plain <img> tag can't send a POST body). An
 * auto-submitting <form>, which node/attacker/server.js provides, forges
 * a POST just as easily as an <img> tag forges a GET.
 *
 * Introduced in: Module 10.
 * Previous module's equivalent: node/bank/server.js (Module 09) -- same
 * balances/session pattern, with /transfer's method changed from GET to
 * POST and nothing else.
 * Prerequisite concepts: Module 09 (CSRF via GET).
 *
 * DO NOT copy this file's /transfer handler into real code.
 * node/bank-fixed/server.js in this same module shows the real fix.
 */

'use strict';

const http = require('http');

const PORT = 8000;
const MAX_BODY_BYTES = 1_000_000;
const balances = { victim: 1000, attacker: 0 };

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
    res.setHeader('Set-Cookie', 'session=victim; Path=/'); // no SameSite attribute here on purpose -- see DECISIONS.md #1
  }

  if (path === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 10 Bank (vulnerable)</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 10 &mdash; "Bank" (POST-only, still vulnerable)</h1>
  <p>Logged in as: <strong>${session}</strong> &mdash; Balance: <strong>$${balances[session] ?? 0}</strong></p>
  <form method="post" action="/transfer">
    <input type="hidden" name="to" value="someone-else">
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
      res.end('405 Method Not Allowed -- this "fix" only requires POST\n');
      return;
    }
    // THE REMAINING VULNERABILITY: POST is required, but nothing checks
    // WHERE the POST came from, and nothing requires a value the
    // attacker couldn't already know or guess (see DECISIONS.md #2)
    const body = await readBody(req);
    const params = parseFormEncoded(body);
    const to = params.to || 'attacker';
    const amount = parseInt(params.amount, 10) || 0;
    balances[session] = (balances[session] ?? 0) - amount;
    balances[to] = (balances[to] ?? 0) + amount;
    console.log(`[transfer] ${session} -> ${to}: $${amount} (POST, but no CSRF token checked)`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Transferred $${amount} from ${session} to ${to}\n`);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 10 BANK -- naive POST-only "fix" (STILL VULNERABLE) up on http://localhost:${PORT}`);
});
