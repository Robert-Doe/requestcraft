/*
 * server.js
 *
 * Module 14: Input Validation as Defense-in-Depth.
 *
 * Three routes, one closed-set field ("sort order," which should only
 * ever be "asc" or "desc"), demonstrating why an ALLOWLIST (accept only
 * known-good values) works where a BLOCKLIST (reject known-bad
 * patterns) fails -- and a fourth route showing a field where
 * allowlisting isn't even possible, to make clear validation is not a
 * universal substitute for Module 11's encoding fix.
 *
 * Introduced in: Module 14.
 * Previous module's equivalent: none directly -- this module revisits
 * the blocklist-bypass idea from Module 07's Brain Exercise with a
 * concrete, runnable comparison against a working allowlist.
 * Prerequisite concepts: Module 07 (Stored XSS via POST) for the
 * blocklist-bypass intuition; Module 11 (Output Encoding Defenses) for
 * encodeHtml(), reused here unchanged.
 *
 * DO NOT copy the /blocklist route into real code -- it's the "before" example.
 */

'use strict';

const http = require('http');

const PORT = 8000;

// Identical to Module 11's encoder
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

function page(title, bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:sans-serif;max-width:640px;margin:40px auto;">${bodyHtml}</body></html>`;
}

const server = http.createServer((req, res) => {
  const [path, queryString = ''] = req.url.split('?');
  const params = parseFormEncoded(queryString);
  const order = params.order ?? 'asc';

  if (path === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('Module 14', `
      <h1>Module 14 &mdash; Input Validation as Defense-in-Depth</h1>
      <p>"order" should only ever be "asc" or "desc". Try
      <code>?order=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E</code> on each route:</p>
      <ul>
        <li><a href="/blocklist?order=asc">/blocklist</a> -- rejects "&lt;script" substrings only</li>
        <li><a href="/allowlist?order=asc">/allowlist</a> -- accepts ONLY the exact strings "asc"/"desc"</li>
      </ul>
      <p>And a field where allowlisting isn't possible at all:</p>
      <ul>
        <li><a href="/freetext?msg=hello">/freetext</a> -- an open-ended value; encoding is the only real defense here</li>
      </ul>
    `));
    return;
  }

  if (path === '/blocklist') {
    // NAIVE VALIDATION: rejects only if the literal substring "<script"
    // appears -- exactly the flawed approach Module 07's Brain Exercise
    // warned about. Everything else passes through UNENCODED.
    const isRejected = /<script/i.test(order);
    const value = isRejected ? 'asc (rejected -- contained "<script")' : order;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('blocklist', `<p>Sort order: ${value}</p><p><a href="/">&larr; back</a></p>`));
    return;
  }

  if (path === '/allowlist') {
    // REAL VALIDATION: only these two EXACT strings are ever accepted.
    // Anything else -- no matter what it contains -- falls back to a
    // safe default. Encoding is still applied too (defense-in-depth,
    // see DECISIONS.md #2), even though the allowlist alone already
    // makes this field's sink unreachable by attacker-controlled markup.
    const safeOrder = (order === 'asc' || order === 'desc') ? order : 'asc';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('allowlist', `<p>Sort order: ${encodeHtml(safeOrder)}</p><p><a href="/">&larr; back</a></p>`));
    return;
  }

  if (path === '/freetext') {
    // No allowlist is possible here -- a free-text message has
    // effectively infinite legitimate values. Encoding is the ONLY
    // defense that generalizes to this kind of field.
    const msg = params.msg ?? '';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('freetext', `<p>Message: ${encodeHtml(msg)}</p><p><a href="/">&larr; back</a></p>`));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 14 demo up on http://localhost:${PORT}`);
});
