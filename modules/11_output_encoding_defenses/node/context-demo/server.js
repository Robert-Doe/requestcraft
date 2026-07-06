/*
 * server.js
 *
 * Module 11: Output Encoding Defenses -- the context-quoting trap.
 *
 * Three routes, same encodeHtml() function, same payload -- and only
 * ONE of the three is actually safe. This demonstrates that HTML-entity
 * encoding a value is necessary but NOT sufficient when that value lands
 * inside an HTML attribute: the attribute must ALSO be quoted, because
 * encodeHtml() does not escape the space character, and an unquoted
 * attribute treats a space as "the attribute value just ended."
 *
 * Introduced in: Module 11.
 * Previous module's equivalent: none -- this is a new, standalone
 * demonstration, not a fix to a previously-built file.
 * Prerequisite concepts: Module 06 (Sources & Sinks) for the general
 * vocabulary; node/reflected-fixed/server.js in this same module for
 * encodeHtml() itself.
 */

'use strict';

const http = require('http');

const PORT = 8000;

// Identical to reflected-fixed/server.js
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
  const color = params.color || 'blue';

  if (path === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('Module 11 context demo', `
      <h1>Module 11 &mdash; Attribute Context Demo</h1>
      <p>Try <code>?color=red%20onmouseover=alert(1)</code> on each route below and inspect the rendered element.</p>
      <ul>
        <li><a href="/unquoted-unencoded?color=red">unquoted-unencoded</a> -- Module 05-style raw bug</li>
        <li><a href="/unquoted-encoded?color=red">unquoted-encoded</a> -- encoded, but STILL BROKEN</li>
        <li><a href="/quoted-encoded?color=red">quoted-encoded</a> -- encoded AND quoted -- actually safe</li>
      </ul>
    `));
    return;
  }

  if (path === '/unquoted-unencoded') {
    // No encoding, no quotes at all -- worst case, identical in spirit to Module 05
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('unquoted-unencoded', `<div id="target" style=${color}>Sample text</div>`));
    return;
  }

  if (path === '/unquoted-encoded') {
    // encodeHtml() runs, but the attribute is STILL not quoted --
    // encodeHtml() never touches the space character, so a payload like
    // "red onmouseover=alert(1)" passes through completely unchanged
    // and still creates a second, real attribute
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('unquoted-encoded', `<div id="target" style=${encodeHtml(color)}>Sample text</div>`));
    return;
  }

  if (path === '/quoted-encoded') {
    // encodeHtml() runs AND the attribute is quoted -- the quote
    // character itself is what makes a space harmless inside the value
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('quoted-encoded', `<div id="target" style="${encodeHtml(color)}">Sample text</div>`));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 11 context-demo up on http://localhost:${PORT}`);
});
