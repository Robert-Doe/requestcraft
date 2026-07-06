/*
 * server.js (the "guestbook" -- session cookie WITH HttpOnly + SameSite)
 *
 * Module 13: Cookie & Session Hardening.
 *
 * Identical stored-XSS bug to vulnerable-cookie/server.js -- STILL
 * UNFIXED, on purpose (see that file's header comment for why). The
 * only change is the Set-Cookie header: HttpOnly means no JavaScript,
 * on this page or injected into it, can read this cookie's value via
 * document.cookie AT ALL -- the browser withholds it from script access
 * entirely, at the browser level, regardless of what script asks. Adding
 * SameSite=Lax also reduces exposure to the CSRF techniques from
 * Modules 09-10, as a bonus (not this module's main lesson, but the
 * flags are normally set together in real code).
 *
 * Introduced in: Module 13.
 * Previous module's equivalent: node/vulnerable-cookie/server.js (this
 * module) -- same bug, cookie hardened.
 * Prerequisite concepts: Module 07 (Stored XSS via POST), this module's
 * own vulnerable-cookie/server.js (read that one first).
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

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 13 Guestbook (fixed cookie)</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 13 &mdash; Guestbook (session cookie WITH HttpOnly)</h1>
  <p style="color:#888">document.cookie in this page's console will NOT show the session cookie at all.</p>
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
    // THE FIX: HttpOnly makes this cookie invisible to document.cookie,
    // in ANY script, injected or legitimate. SameSite=Lax is a bonus
    // hardening flag reused from Module 10 -- not this module's focus,
    // but standard practice to set alongside HttpOnly.
    res.setHeader('Set-Cookie', 'session=SECRET-abc123; Path=/; HttpOnly; SameSite=Lax');
  }

  if (path === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderGuestbook());
    return;
  }

  if (path === '/comment' && req.method === 'POST') {
    const body = await readBody(req);
    const params = parseFormEncoded(body);
    // Storage still unfixed -- the point is what HttpOnly denies the
    // attacker even though the script still runs (see DECISIONS.md #1)
    comments.push({ name: params.name || '(anonymous)', message: params.message || '' });
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 13 FIXED-COOKIE guestbook up on http://localhost:${PORT}`);
});
