<?php

/**
 * router.php
 *
 * Module 12: Content Security Policy.
 *
 * PHP equivalent of node/server.js -- identical vulnerable, unescaped
 * search page, served under three different CSP headers.
 *
 * Introduced in: Module 12.
 * Previous module's equivalent: php/router.php (Module 05).
 * Prerequisite concepts: Module 05 (Reflected XSS via GET), Module 11
 * (Output Encoding Defenses).
 *
 * DO NOT treat /no-csp or /csp-unsafe-inline as safe.
 */

declare(strict_types=1);

function vulnerable_page(string $q): string
{
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Module 12</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">"
        . "<h1>Module 12 &mdash; CSP Demo (PHP)</h1>"
        . "<p>You searched for: $q</p>"
        . "<p><a href=\"/\">&larr; back</a></p>"
        . "</body></html>";
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$q = $_GET['q'] ?? '';

header('Content-Type: text/html; charset=utf-8');

if ($path === '/') {
    echo "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Module 12</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">"
        . "<h1>Module 12 &mdash; Content Security Policy (PHP)</h1>"
        . "<p>Same vulnerable search, three different CSP headers:</p>"
        . "<ul>"
        . "<li><a href=\"/no-csp?q=hello\">/no-csp</a></li>"
        . "<li><a href=\"/csp-strict?q=hello\">/csp-strict</a></li>"
        . "<li><a href=\"/csp-unsafe-inline?q=hello\">/csp-unsafe-inline</a></li>"
        . "</ul></body></html>";
    exit;
}

if ($path === '/no-csp') {
    echo vulnerable_page($q);
    exit;
}

if ($path === '/csp-strict') {
    header("Content-Security-Policy: default-src 'self'; script-src 'self'");
    echo vulnerable_page($q);
    exit;
}

if ($path === '/csp-unsafe-inline') {
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'");
    echo vulnerable_page($q);
    exit;
}

http_response_code(404);
echo 'Not found';
