<?php

/**
 * router.php
 *
 * Module 11: Output Encoding Defenses (fixing Module 05).
 *
 * PHP's built-in htmlspecialchars() is used here directly, rather than
 * hand-rolled the way the Node version builds its own encodeHtml(). See
 * DECISIONS.md #2 for why: PHP already ships a correct, battle-tested
 * encoder as part of the language itself -- reimplementing it would
 * teach an anti-pattern, not the underlying mechanism.
 *
 * Introduced in: Module 11.
 * Previous module's equivalent: php/router.php (Module 05) -- this file
 * is that one, patched.
 * Prerequisite concepts: Module 05 (Reflected XSS via GET).
 */

declare(strict_types=1);

/*
 * enc -- shorthand wrapper around PHP's real encoder, with the flags
 * that actually matter set explicitly rather than left to defaults.
 *
 * value: the untrusted string to encode
 * returns: a string safe for HTML BODY context (see context-demo/ for
 *          why attribute context needs quoting as well as this)
 *
 * ENT_QUOTES encodes BOTH double and single quotes -- PHP's default
 * (ENT_HTML401 without ENT_QUOTES, historically) only encodes double
 * quotes, silently leaving single-quoted attributes breakable. Always
 * pass ENT_QUOTES explicitly; never rely on the default.
 */
function enc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
header('Content-Type: text/html; charset=utf-8');

if ($path === '/' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 11 (fixed)</title></head>'
        . '<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">'
        . '<h1>Module 11 &mdash; Search (PHP, FIXED)</h1>'
        . '<form method="get" action="/search">'
        . '<input name="q" placeholder="search term" size="40">'
        . '<button type="submit">Search</button>'
        . '</form>'
        . '<p>Try the exact same payload from Module 05 -- it renders as visible text now.</p>'
        . '</body></html>';
    exit;
}

if ($path === '/search' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = $_GET['q'] ?? '';
    // THIS is the entire fix, compared to Module 05: enc() wraps $q
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Search results</title></head>'
        . '<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">'
        . '<h1>Search results</h1>'
        . '<p>You searched for: ' . enc($q) . '</p>'
        . '<p><a href="/">&larr; back</a></p>'
        . '</body></html>';
    exit;
}

http_response_code(404);
echo 'Not found';
