<?php

/**
 * router.php
 *
 * Module 05: Reflected XSS via GET.
 *
 * PHP equivalent of node/server.js -- DELIBERATELY VULNERABLE. The
 * /search route drops $_GET['q'] straight into the HTML response with
 * plain string interpolation. No htmlspecialchars(), no escaping.
 *
 * Introduced in: Module 05.
 * Previous module's equivalent: php/router.php (Module 04).
 * Prerequisite concepts: Module 04 (Idempotency & Safety).
 *
 * DO NOT copy this file's /search handler into real code. Module 11
 * (Output Encoding Defenses) comes back and fixes this exact file.
 */

declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

header('Content-Type: text/html; charset=utf-8');

if ($path === '/' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 05</title></head>'
        . '<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">'
        . '<h1>Module 05 &mdash; Reflected XSS via GET (PHP)</h1>'
        . '<form method="get" action="/search">'
        . '<input name="q" placeholder="search term" size="40">'
        . '<button type="submit">Search</button>'
        . '</form>'
        . '<p>Try a normal search first. Then read the tutorial and try the payload URL.</p>'
        . '</body></html>';
    exit;
}

if ($path === '/search' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = $_GET['q'] ?? '';
    error_log('[search] rendering page with raw, unescaped q = ' . json_encode($q));

    // THIS LINE IS THE VULNERABILITY: $q is interpolated directly into
    // the HTML string with no htmlspecialchars() call. Whatever arrived
    // in the URL becomes real markup in the response, verbatim.
    echo "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Search results</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">"
        . "<h1>Search results</h1>"
        . "<p>You searched for: $q</p>"
        . "<p><a href=\"/\">&larr; back</a></p>"
        . "</body></html>";
    exit;
}

http_response_code(404);
echo 'Not found';
