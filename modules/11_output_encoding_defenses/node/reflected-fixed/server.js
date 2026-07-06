/*
 * server.js
 *
 * Module 11: Output Encoding Defenses (fixing Module 05).
 *
 * This is Module 05's exact vulnerable search server, with exactly one
 * change: every value written into HTML now passes through encodeHtml()
 * first. Same routes, same structure, same payload you tried before --
 * now inert.
 *
 * Introduced in: Module 11.
 * Previous module's equivalent: node/server.js (Module 05) -- this file
 * is that one, patched.
 * Prerequisite concepts: Module 05 (Reflected XSS via GET), Module 06
 * (Sources & Sinks).
 */

'use strict';

const http = require('http');

const PORT = 8000;

/*
 * encodeHtml -- converts the five characters that give HTML its
 * structure into their harmless entity equivalents, so a string can
 * never be mistaken for markup, no matter what it contains.
 *
 * str: any value about to be written into an HTML BODY context
 *      (between tags -- NOT inside an attribute; see context-demo/
 *      in this same module for why that distinction matters)
 * returns: a string safe to place directly into HTML body text
 *
 * Assumes: the value is being written into HTML *body* text. A value
 *          written into an HTML *attribute* needs this SAME encoding
 *          PLUS a quoted attribute delimiter -- encoding alone is not
 *          sufficient there (see context-demo/server.js).
 * Note: '&' MUST be replaced first -- replacing it after the others
 *       would double-encode the '&' just produced by, say, '<' -> '&lt;'.
 */
function encodeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')  // must run first -- see Note above
    .replace(/</g, '&lt;')   // stops a tag from opening
    .replace(/>/g, '&gt;')   // stops a tag from closing
    .replace(/"/g, '&quot;') // stops breaking out of a double-quoted attribute
    .replace(/'/g, '&#39;'); // stops breaking out of a single-quoted attribute
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

function homePage() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 11 (fixed)</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 11 &mdash; Search (FIXED)</h1>
  <form method="get" action="/search">
    <input name="q" placeholder="search term" size="40">
    <button type="submit">Search</button>
  </form>
  <p>Try the exact same payload from Module 05 -- it will render as visible text now, not execute.</p>
</body></html>`;
}

/*
 * fixedSearchPage -- Module 05's exact page, with `q` now passed through
 * encodeHtml() before interpolation. THIS is the entire fix.
 */
function fixedSearchPage(q) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Search results</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Search results</h1>
  <p>You searched for: ${encodeHtml(q)}</p>
  <p><a href="/">&larr; back</a></p>
</body></html>`;
}

const server = http.createServer((req, res) => {
  const [path, queryString = ''] = req.url.split('?');
  const getParams = parseFormEncoded(queryString);

  if (path === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(homePage());
    return;
  }

  if (path === '/search' && req.method === 'GET') {
    const q = getParams.q || '';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fixedSearchPage(q));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 11 reflected-fixed demo up on http://localhost:${PORT}`);
  console.log('Try the Module 05 payload URL again -- compare the result.\n');
});
