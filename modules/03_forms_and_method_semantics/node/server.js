/*
 * server.js
 *
 * Module 03: Forms & Method Semantics.
 *
 * Serves two real HTML forms -- one method="get", one method="post" --
 * so you can watch, in your own browser's address bar, the one
 * structural difference that matters most day-to-day: GET puts its
 * data in the URL (visible, bookmarkable, logged); POST does not.
 *
 * Introduced in: Module 03.
 * Previous module's equivalent: node/server.js (Module 02) -- reuses
 * that module's parseFormEncoded()/readBody() verbatim, since parsing
 * isn't a new concept here; serving forms and comparing method
 * behavior is.
 * Prerequisite concepts: Module 02 (Superglobals & req Objects) -- you
 * must already know that GET data arrives via the query string and
 * POST data arrives via the body.
 */

'use strict';

const http = require('http');

const PORT = 8000;
const MAX_BODY_BYTES = 1_000_000;

// --- reused verbatim from Module 02 (see that module's DECISIONS.md for why it's hand-rolled) ---
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
// --- end reused block ---

/*
 * accessLogLine -- builds a one-line string mimicking a real web server's
 * access log, to make visible what a log CAN and CANNOT see.
 *
 * method: the HTTP method of the request
 * path: the request path, WITHOUT query string
 * queryString: the raw query string (empty for POST, since POST's data
 *              never appears here regardless of method)
 * returns: a formatted log line
 *
 * Note: real access logs (Apache's combined log format, nginx's default)
 *       genuinely do record the full URL including query string, and
 *       genuinely do NOT record POST bodies -- this function is not an
 *       exaggeration for teaching purposes, it matches real server behavior.
 */
function accessLogLine(method, path, queryString) {
  const url = queryString ? `${path}?${queryString}` : path;
  return `[ACCESS LOG] ${method} ${url}`; // a real access log line has this exact shape and this exact blind spot
}

function page(title, bodyHtml) {
  // <meta charset> tells the browser how to decode the bytes we send --
  // without it, some browsers guess Latin-1 and mangle non-ASCII characters
  // like the em dashes used throughout this page
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:sans-serif;max-width:640px;margin:40px auto;">${bodyHtml}</body></html>`;
}

const server = http.createServer(async (req, res) => {
  const [path, queryString = ''] = req.url.split('?');
  const getParams = parseFormEncoded(queryString);

  // Print the simulated access log line for EVERY request, before we even
  // know what route it's for -- this is what a real reverse proxy does
  console.log(accessLogLine(req.method, path, queryString));

  if (path === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('Module 03', `
      <h1>Module 03 — Forms &amp; Method Semantics</h1>
      <h2>Form A — method="get"</h2>
      <form method="get" action="/search">
        <input name="q" placeholder="search term">
        <button type="submit">Search (GET)</button>
      </form>
      <h2>Form B — method="post"</h2>
      <form method="post" action="/comment">
        <input name="message" placeholder="leave a message">
        <button type="submit">Post (POST)</button>
      </form>
      <p>Submit each one, then look at your address bar and compare.</p>
    `));
    return;
  }

  if (path === '/search' && req.method === 'GET') {
    const q = getParams.q || '(empty)';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('Search result', `
      <p>You searched for: <strong>${q}</strong></p>
      <p>Look at your address bar right now -- it shows <code>?q=${q}</code>.
      That's not a coincidence: GET puts its data in the URL, which is why
      you can see it, bookmark it, and share it as a link.</p>
      <p><a href="/">&larr; back</a></p>
    `));
    return;
  }

  if (path === '/comment' && req.method === 'POST') {
    const body = await readBody(req);
    const postParams = parseFormEncoded(body);
    const message = postParams.message || '(empty)';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('Comment posted', `
      <p>You posted: <strong>${message}</strong></p>
      <p>Look at your address bar right now -- it still just says
      <code>/comment</code>, with no trace of "${message}" anywhere in it.
      The data went in through the body, not the URL, which is why the
      access log line printed on the server console for this request has
      no query string on it either -- check your terminal.</p>
      <p><a href="/">&larr; back</a></p>
    `));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 03 demo up on http://localhost:${PORT}`);
  console.log('Open it in a browser and submit both forms.\n');
});
