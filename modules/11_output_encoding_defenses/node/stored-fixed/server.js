/*
 * server.js
 *
 * Module 11: Output Encoding Defenses (fixing Module 07).
 *
 * Module 07's exact guestbook, with one change: every comment's name
 * and message pass through encodeHtml() at render time. Storage is
 * untouched -- comments are still saved exactly as submitted (see
 * DECISIONS.md #1 for why the fix belongs at render time, not write time).
 *
 * Introduced in: Module 11.
 * Previous module's equivalent: node/server.js (Module 07) -- this file
 * is that one, patched.
 * Prerequisite concepts: Module 07 (Stored XSS via POST).
 */

'use strict';

const http = require('http');

const PORT = 8000;
const MAX_BODY_BYTES = 1_000_000;
const comments = [];

// Identical to reflected-fixed/server.js -- see that file for the full
// explanation of each line
function encodeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

/*
 * renderGuestbook -- Module 07's exact function, with encodeHtml() now
 * wrapping both `c.name` and `c.message`. THIS is the entire fix --
 * nothing about storage, routing, or anything else changed.
 */
function renderGuestbook() {
  const commentsHtml = comments
    .map((c) => `<div style="border:1px solid #ccc; padding:8px; margin:8px 0;">
      <strong>${encodeHtml(c.name)}</strong>: ${encodeHtml(c.message)}
    </div>`)
    .join('\n');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 11 Guestbook (fixed)</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 11 &mdash; Guestbook (FIXED)</h1>
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

  if (path === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderGuestbook());
    return;
  }

  if (path === '/comment' && req.method === 'POST') {
    const body = await readBody(req);
    const params = parseFormEncoded(body);
    // Storage is UNCHANGED from Module 07 -- still raw, still unescaped.
    // The fix lives entirely in renderGuestbook() above, at render time.
    comments.push({ name: params.name || '(anonymous)', message: params.message || '' });
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 11 stored-fixed demo up on http://localhost:${PORT}`);
  console.log('Post the Module 07 payload again -- compare the result.\n');
});
