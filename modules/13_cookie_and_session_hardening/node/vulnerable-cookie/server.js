/*
 * server.js (the "guestbook" -- session cookie WITHOUT HttpOnly)
 *
 * Module 13: Cookie & Session Hardening.
 *
 * This is Module 07's exact stored-XSS guestbook, PLUS a session cookie
 * set on first visit. The cookie has no HttpOnly attribute -- meaning
 * `document.cookie` inside any script running on this page, including
 * an attacker's injected one, can read it in full. This module doesn't
 * fix the underlying stored-XSS bug at all (that's Module 11's job,
 * deliberately left undone here, same reasoning as Module 12) -- it
 * shows what an unprotected session cookie adds to the same bug: a
 * script that runs can now also STEAL your login session, not just run.
 *
 * Introduced in: Module 13.
 * Previous module's equivalent: node/server.js (Module 07) -- identical
 * vulnerable rendering; this file adds a session cookie without any
 * hardening flags.
 * Prerequisite concepts: Module 07 (Stored XSS via POST).
 *
 * DO NOT copy this file's Set-Cookie line into real code.
 * node/fixed-cookie/server.js in this same module shows the real fix.
 */

'use strict';

const http = require('http');

const PORT = 8000;
const MAX_BODY_BYTES = 1_000_000;
const comments = [];

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

function renderGuestbook() {
  const commentsHtml = comments
    .map((c) => `<div style="border:1px solid #ccc; padding:8px; margin:8px 0;">
      <strong>${c.name}</strong>: ${c.message}
    </div>`)
    .join('\n');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 13 Guestbook (vulnerable cookie)</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 13 &mdash; Guestbook (session cookie WITHOUT HttpOnly)</h1>
  <p style="color:#888">document.cookie in this page's console will show your session cookie in full.</p>
  <form method="post" action="/comment">
    <input name="name" placeholder="your name" required><br><br>
    <textarea name="message" placeholder="leave a message" rows="3" cols="40" required></textarea><br><br>
    <button type="submit">Post comment</button>
  </form>
  <h2>Comments (${comments.length})</h2>
  ${commentsHtml || '<p><em>No comments yet -- be the first.</em></p>'}
</body></html>`;
}

const server = http.createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  const cookies = parseCookies(req.headers.cookie);

  if (!cookies.session) {
    // THE VULNERABILITY: no HttpOnly attribute at all -- this cookie is
    // fully readable from any script that runs on this page
    res.setHeader('Set-Cookie', 'session=SECRET-abc123; Path=/');
  }

  if (path === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderGuestbook());
    return;
  }

  if (path === '/comment' && req.method === 'POST') {
    const body = await readBody(req);
    const params = parseFormEncoded(body);
    // Same unfixed storage as Module 07 -- this module is not about the
    // injection point, it's about what an unprotected cookie adds to it
    comments.push({ name: params.name || '(anonymous)', message: params.message || '' });
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 13 VULNERABLE-COOKIE guestbook up on http://localhost:${PORT}`);
});
