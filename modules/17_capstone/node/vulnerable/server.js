/*
 * server.js
 *
 * Module 17 Capstone: "Community Board" -- VULNERABLE VERSION.
 *
 * A single small application combining four independent bugs from
 * across this entire course, the way a real application usually
 * accumulates them -- not as one contrived mega-bug, but as several
 * ordinary, independently-introduced mistakes sitting side by side:
 *
 *   1. Reflected XSS in /search       (Module 05), behind a naive
 *      word-blocklist filter (Module 07 Brain Exercise / Module 16)
 *   2. Stored XSS in posted messages  (Module 07)
 *   3. CSRF-able delete via plain GET (Module 04 / Module 09)
 *   4. Session cookie with no HttpOnly, no SameSite (Module 13)
 *
 * Introduced in: Module 17 (Capstone).
 * Previous module's equivalents: this file combines patterns from
 * node/server.js in Modules 05, 07, 09, 13, and 16 into one application.
 * Prerequisite concepts: all of Modules 04-16.
 *
 * DO NOT copy any part of this file into real code. This is the
 * "before" state for the capstone exercise. node/hardened/server.js in
 * this same module is the fixed version.
 */

'use strict';

const http = require('http');

const PORT = 8000;
const posts = []; // { id, name, message }
let nextId = 1;

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

// BUG #1 (naive filter -- Module 16): strips the word "script" once,
// nothing else. Combine with BUG shape from Module 05/07: the result
// is written into HTML completely unescaped otherwise.
function naiveFilter(q) {
  return q.replace(/script/gi, '');
}

function page(session, bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Community Board</title></head>
<body style="font-family:sans-serif;max-width:680px;margin:40px auto;">
  <h1>Community Board <small style="color:#888;font-size:0.5em;">(VULNERABLE build)</small></h1>
  <p style="color:#888">Logged in as: ${session}</p>
  <form method="get" action="/search">
    <input name="q" placeholder="search posts"><button type="submit">Search</button>
  </form>
  <form method="post" action="/post">
    <input name="name" placeholder="your name" required><br><br>
    <textarea name="message" placeholder="write a post" rows="3" cols="40" required></textarea><br><br>
    <button type="submit">Post</button>
  </form>
  ${bodyHtml}
</body></html>`;
}

function renderPosts() {
  return posts.map((p) => `
    <div style="border:1px solid #ccc;padding:8px;margin:8px 0;">
      <strong>${p.name}</strong>: ${p.message}
      <!-- BUG #3: delete is a plain GET, no confirmation, no CSRF protection -->
      <a href="/delete?id=${p.id}" style="color:red;font-size:0.8em;">[delete]</a>
    </div>`).join('\n') || '<p><em>No posts yet.</em></p>';
}

const server = http.createServer(async (req, res) => {
  const [urlPath, queryString = ''] = req.url.split('?');
  const params = parseFormEncoded(queryString);
  const cookies = parseCookies(req.headers.cookie);
  let session = cookies.session;

  if (!session) {
    session = 'guest' + Math.floor(Math.random() * 10000);
    // BUG #4: no HttpOnly, no SameSite -- see Module 13
    res.setHeader('Set-Cookie', `session=${session}; Path=/`);
  }

  if (urlPath === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page(session, `<h2>Posts</h2>${renderPosts()}`));
    return;
  }

  if (urlPath === '/search' && req.method === 'GET') {
    const q = params.q || '';
    const filtered = naiveFilter(q); // BUG #1's filter -- looks like a fix, isn't
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    // BUG #1 continued: filtered value written completely unescaped
    res.end(page(session, `<h2>Search results</h2><p>You searched for: ${filtered}</p>`));
    return;
  }

  if (urlPath === '/post' && req.method === 'POST') {
    const body = await readBody(req);
    const p = parseFormEncoded(body);
    // BUG #2: stored completely unescaped
    posts.push({ id: nextId++, name: p.name || '(anonymous)', message: p.message || '' });
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  if (urlPath === '/delete' && req.method === 'GET') {
    // BUG #3: no method restriction beyond "must be GET" (the opposite
    // of Module 04's lesson), no ownership check, no CSRF token
    const id = parseInt(params.id, 10);
    const idx = posts.findIndex((p) => p.id === id);
    if (idx !== -1) posts.splice(idx, 1);
    console.log(`[delete] post ${id} removed via plain GET, no confirmation, no CSRF check`);
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Capstone VULNERABLE Community Board up on http://localhost:${PORT}`);
});
