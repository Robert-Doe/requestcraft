<?php

/**
 * router.php
 *
 * Module 08: DOM-Based XSS.
 *
 * PHP equivalent of node/server.js -- serves the exact same static page,
 * byte-for-byte identical <script> block. PHP has nothing to do with
 * this module's vulnerability at all, which is the point: this file
 * exists only so the course's "every module has a PHP and a Node
 * version" pattern holds, even for a bug that is 100% client-side.
 *
 * Introduced in: Module 08.
 * Previous module's equivalent: php/router.php (Module 07).
 * Prerequisite concepts: Module 06 (Sources & Sinks).
 */

declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: text/html; charset=utf-8');
    echo <<<'HTML'
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 08</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Module 08 &mdash; DOM-Based XSS (PHP)</h1>
  <p>This page reads the URL fragment (everything after '#') and greets you by name.</p>
  <p>Try: <code>#Bob</code> normally, then read the tutorial for the payload.</p>
  <div id="greeting" style="border:1px solid #ccc; padding:12px;"></div>

  <script>
    // THIS FUNCTION IS THE VULNERABILITY -- identical to the Node version.
    // PHP never sees this run; it's pure client-side JavaScript.
    function updateGreeting() {
      var name = location.hash.substring(1);
      var decoded = name ? decodeURIComponent(name) : 'stranger';
      document.getElementById('greeting').innerHTML = 'Hello, ' + decoded + '!';
    }
    window.addEventListener('hashchange', updateGreeting);
    updateGreeting();
  </script>
</body></html>
HTML;
    exit;
}

http_response_code(404);
echo 'Not found';
