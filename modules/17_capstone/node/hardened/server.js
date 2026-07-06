/*
 * server.js
 *
 * Module 17 Capstone: "Community Board" -- HARDENED VERSION.
 *
 * The identical application as node/vulnerable/server.js, with every
 * one of that file's four bugs fixed using the exact techniques this
 * course already taught -- no new concepts introduced here, only
 * applied:
 *
 *   1. Reflected XSS  -> real encoding (Module 11), naive filter DELETED
 *      entirely rather than kept alongside encoding (Module 14: a real
 *      allowlist/encoding fix replaces a blocklist, it doesn't stack with it)
 *   2. Stored XSS     -> encoding at render time (Module 11)
 *   3. CSRF delete    -> moved to POST + CSRF token required (Module 10)
 *   4. Cookie exposure -> HttpOnly + SameSite=Lax (Module 13)
 *
 * Plus two bonus layers this capstone adds for completeness:
 *   5. Content-Security-Policy header (Module 12)
 *   6. Allowlist-validated "category" field on posts (Module 14)
 *
 * Introduced in: Module 17 (Capstone).
 * Previous module's equivalent: node/vulnerable/server.js (this module).
 * Prerequisite concepts: all of Modules 04-16.
 */

'use strict';

const http = require('http');
const crypto = require('crypto');

const PORT = 8000;
const posts = []; // { id, name, message, category }
let nextId = 1;
const csrfTokens = {}; // session -> token

const VALID_CATEGORIES = ['general', 'question', 'announcement']; // Module 14: allowlist

function encodeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function page(session, token, bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Community Board</title></head>
<body style="font-family:sans-serif;max-width:680px;margin:40px auto;">
  <h1>Community Board <small style="color:#888;font-size:0.5em;">(HARDENED build)</small></h1>
  <p style="color:#888">Logged in as: ${encodeHtml(session)}</p>
  <form method="get" action="/search">
    <input name="q" placeholder="search posts"><button type="submit">Search</button>
  </form>
  <form method="post" action="/post">
    <input name="name" placeholder="your name" required><br><br>
    <select name="category">
      <option value="general">General</option>
      <option value="question">Question</option>
      <option value="announcement">Announcement</option>
    </select><br><br>
    <textarea name="message" placeholder="write a post" rows="3" cols="40" required></textarea><br><br>
    <input type="hidden" name="csrf_token" value="${token}">
    <button type="submit">Post</button>
  </form>
  ${bodyHtml}
</body></html>`;
}

function renderPosts(token) {
  return posts.map((p) => `
    <div style="border:1px solid #ccc;padding:8px;margin:8px 0;">
      <span style="font-size:0.75em;color:#888;">[${encodeHtml(p.category)}]</span>
      <strong>${encodeHtml(p.name)}</strong>: ${encodeHtml(p.message)}
      <form method="post" action="/delete" style="display:inline">
        <input type="hidden" name="id" value="${p.id}">
        <input type="hidden" name="csrf_token" value="${token}">
        <button type="submit" style="color:red;font-size:0.8em;background:none;border:none;cursor:pointer;padding:0;">[delete]</button>
      </form>
    </div>`).join('\n') || '<p><em>No posts yet.</em></p>';
}

const server = http.createServer(async (req, res) => {
  const [urlPath, queryString = ''] = req.url.split('?');
  const params = parseFormEncoded(queryString);
  const cookies = parseCookies(req.headers.cookie);
  let session = cookies.session;

  if (!session) {
    session = 'guest' + Math.floor(Math.random() * 10000);
    // FIX #4: HttpOnly stops JS from reading it; SameSite=Lax stops it
    // riding along on cross-site requests
    res.setHeader('Set-Cookie', `session=${session}; Path=/; HttpOnly; SameSite=Lax`);
  }
  if (!csrfTokens[session]) {
    csrfTokens[session] = crypto.randomBytes(16).toString('hex'); // FIX #3, part 1
  }
  const token = csrfTokens[session];

  // FIX #5: strict CSP -- blocks inline script execution even if an
  // encoding call were ever missed somewhere in this file
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'");

  if (urlPath === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page(session, token, `<h2>Posts</h2>${renderPosts(token)}`));
    return;
  }

  if (urlPath === '/search' && req.method === 'GET') {
    const q = params.q || '';
    // FIX #1: no blocklist at all -- real encoding, applied unconditionally
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page(session, token, `<h2>Search results</h2><p>You searched for: ${encodeHtml(q)}</p>`));
    return;
  }

  if (urlPath === '/post' && req.method === 'POST') {
    const body = await readBody(req);
    const p = parseFormEncoded(body);
    // FIX #6: category is allowlisted -- anything unrecognized silently
    // becomes 'general' rather than being trusted
    const category = VALID_CATEGORIES.includes(p.category) ? p.category : 'general';
    // FIX #2's write side: storage stays raw (see Module 11 Decision #1);
    // the fix lives in renderPosts() above, at render time
    posts.push({ id: nextId++, name: p.name || '(anonymous)', message: p.message || '', category });
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  if (urlPath === '/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const p = parseFormEncoded(body);
    // FIX #3, part 2: reject unless the CSRF token matches this session's
    if (p.csrf_token !== csrfTokens[session]) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden -- missing or invalid CSRF token\n');
      return;
    }
    const id = parseInt(p.id, 10);
    const idx = posts.findIndex((post) => post.id === id);
    if (idx !== -1) posts.splice(idx, 1);
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  if (urlPath === '/delete' && req.method === 'GET') {
    // FIX #3, part 3: GET no longer performs the mutation at all (Module 04)
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('405 Method Not Allowed -- delete requires POST + a valid CSRF token\n');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Capstone HARDENED Community Board up on http://localhost:${PORT}`);
});
