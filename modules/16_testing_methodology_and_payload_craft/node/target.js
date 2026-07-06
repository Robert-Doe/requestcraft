/*
 * target.js
 *
 * Module 16: Testing Methodology & Payload Craft.
 *
 * A deliberately, realistically broken "filter": it strips the literal
 * substring "script" (case-insensitive) wherever it appears, then
 * writes the result into HTML completely unescaped otherwise. This is
 * a real, historically common naive-XSS-filter mistake -- and it is
 * genuinely bypassable in more than one way, which is the entire point
 * of this module's payload-catalog test runner.
 *
 * Introduced in: Module 16.
 * Previous module's equivalent: node/server.js (Module 05) -- the
 * unescaped-interpolation shape is the same; this file adds a "filter"
 * on top of it that LOOKS like a fix but isn't.
 * Prerequisite concepts: Module 07 (Stored XSS via POST) Brain Exercise,
 * Module 14 (Input Validation as Defense-in-Depth) -- you need the
 * "blocklists lose" intuition already in place.
 *
 * DO NOT copy this file's filter into real code. It exists to be swept
 * by test_runner.js and found wanting.
 */

'use strict';

const http = require('http');

const PORT = 8000;

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

/*
 * naiveFilter -- removes the word "script" (any case) and nothing else.
 *
 * q: the raw, untrusted query value
 * returns: q with every "script" substring removed, in a SINGLE pass
 *
 * Note: a single-pass removal does not re-scan its own output for NEW
 * matches created by the removal itself -- this is exactly what makes
 * the nested-tag bypass in this module's payload catalog work.
 */
function naiveFilter(q) {
  return q.replace(/script/gi, '');
}

const server = http.createServer((req, res) => {
  const [path, queryString = ''] = req.url.split('?');
  const params = parseFormEncoded(queryString);

  if (path === '/search') {
    const q = params.q || '';
    const filtered = naiveFilter(q); // THE "FIX" THAT ISN'T
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 16 target</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 16 &mdash; Test Target</h1>
  <p>You searched for: ${filtered}</p>
</body></html>`);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 16 target server up on http://localhost:${PORT}`);
  console.log('Run test_runner.js against it in a second terminal.\n');
});
