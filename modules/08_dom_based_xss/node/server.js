/*
 * server.js
 *
 * Module 08: DOM-Based XSS.
 *
 * This server does almost nothing -- it serves one static page, once.
 * That's the whole point: the vulnerability in this module lives
 * entirely inside client-side JavaScript, in the page's own <script>
 * block. The server never sees the attack payload at all, because the
 * payload travels in the URL FRAGMENT (the part after '#'), which is a
 * purely browser-side concept -- per the URL specification (RFC 3986),
 * browsers never include the fragment when sending an HTTP request.
 *
 * Introduced in: Module 08.
 * Previous module's equivalent: node/server.js (Module 07) -- but unlike
 * every previous module, the vulnerable CODE here isn't server-side at
 * all; this file is just a static file host.
 * Prerequisite concepts: Module 06 (Sources & Sinks) -- you need to
 * already recognize .innerHTML as a dangerous sink on sight, because
 * this module's entire vulnerability is a source/sink pair that never
 * touches this server file.
 *
 * DO NOT copy the vulnerable page's <script> block into real code.
 */

'use strict';

const http = require('http');

const PORT = 8000;

/*
 * vulnerablePage -- the entire vulnerability lives inside this HTML's
 * inline <script>, not in this server file.
 *
 * returns: a full HTML document string
 *
 * Walk through the script: `location.hash.substring(1)` reads whatever
 * comes after '#' in the CURRENT page's own URL -- something the server
 * never received and never will. That value is then handed straight to
 * `.innerHTML =` with no encoding at all. If the hash contains
 * "<img src=x onerror=...>", that becomes real markup, and the onerror
 * handler runs, entirely inside the browser, with zero network requests
 * involved beyond the one that loaded this page in the first place.
 */
function vulnerablePage() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 08</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 08 &mdash; DOM-Based XSS</h1>
  <p>This page reads the URL fragment (everything after '#') and greets you by name.</p>
  <p>Try: <code>#Bob</code> normally, then read the tutorial for the payload.</p>
  <div id="greeting" style="border:1px solid #ccc; padding:12px;"></div>

  <script>
    // THIS FUNCTION IS THE VULNERABILITY. It runs entirely in the browser --
    // the server above never sees location.hash, because fragments are
    // never sent in an HTTP request (see this file's header comment).
    function updateGreeting() {
      var name = location.hash.substring(1); // strip the leading '#'
      var decoded = name ? decodeURIComponent(name) : 'stranger'; // just readability -- does NOT make this safe
      // .innerHTML is the dangerous sink here (see Module 06) -- 'decoded'
      // goes in completely unescaped, exactly like Module 05's and
      // Module 07's bugs, just running client-side instead of server-side
      document.getElementById('greeting').innerHTML = 'Hello, ' + decoded + '!';
    }

    // Re-run whenever the fragment changes WITHOUT a full page reload --
    // this mirrors how real single-page-app routers watch location.hash
    window.addEventListener('hashchange', updateGreeting);
    updateGreeting(); // also run once for whatever hash was present on initial load
  </script>
</body></html>`;
}

const server = http.createServer((req, res) => {
  const path = req.url.split('?')[0];

  if (path === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(vulnerablePage());
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 08 (VULNERABLE ON PURPOSE) demo up on http://localhost:${PORT}`);
  console.log('This page is loaded ONCE -- everything after that happens with zero network requests.\n');
});
