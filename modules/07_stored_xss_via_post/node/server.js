/*
 * server.js
 *
 * Module 07: Stored XSS via POST.
 *
 * This server is DELIBERATELY VULNERABLE. It's a tiny guestbook: POST a
 * name and message, and both get stored, then rendered back -- unescaped
 * -- to EVERY visitor who loads the page afterward, not just the person
 * who posted it. That's the one structural difference from Module 05:
 * there, the payload only ran for whoever clicked the malicious link.
 * Here, once one malicious comment is stored, it attacks every single
 * future visitor automatically, with no link-clicking required at all.
 *
 * Introduced in: Module 07.
 * Previous module's equivalent: node/server.js (Module 05) -- the
 * vulnerable interpolation pattern is identical; what's new is that the
 * value now survives in storage instead of only existing for one request.
 * Prerequisite concepts: Module 05 (Reflected XSS via GET) and Module 06
 * (Sources & Sinks) -- you should already recognize "value goes into
 * innerHTML/echo unescaped" as the dangerous shape on sight.
 *
 * DO NOT copy this file's comment-rendering code into real code.
 * Module 11 (Output Encoding Defenses) comes back and fixes this exact file.
 */

'use strict';

const http = require('http');

const PORT = 8000;
const MAX_BODY_BYTES = 1_000_000;

// In-memory storage -- survives across requests because Node keeps one
// process alive for the server's lifetime (same reasoning as Module 04's
// counter; the PHP version below persists to a file for the same reason
// Module 04's PHP counter did)
const comments = [];

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
      if (received > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error('Body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/*
 * renderGuestbook -- builds the full guestbook page, including every
 * stored comment.
 *
 * returns: a full HTML document string
 *
 * THIS FUNCTION IS THE VULNERABILITY. Each comment's name and message
 * are dropped into the HTML via template literals with no encoding --
 * identical in shape to Module 05's bug, except the loop below means
 * this sink fires once PER STORED COMMENT, for every single visitor who
 * ever loads this page, forever (or until the process restarts).
 */
function renderGuestbook() {
  const commentsHtml = comments
    .map((c) => `<div style="border:1px solid #ccc; padding:8px; margin:8px 0;">
      <strong>${c.name}</strong>: ${c.message}
    </div>`)
    .join('\n');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 07 Guestbook</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 07 &mdash; Guestbook (Stored XSS via POST)</h1>
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
    // Stored exactly as submitted -- no encoding, no validation, no
    // length limit. Every one of those gaps is named, on purpose, in
    // DECISIONS.md.
    comments.push({ name: params.name || '(anonymous)', message: params.message || '' });
    console.log(`[comment] stored: name=${JSON.stringify(params.name)} message=${JSON.stringify(params.message)}`);
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 07 (VULNERABLE ON PURPOSE) demo up on http://localhost:${PORT}`);
  console.log('Post a comment with a <script> tag in the message, then reload the page as a fresh visit.\n');
});
