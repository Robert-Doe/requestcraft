<?php

/**
 * router.php
 *
 * Module 11: Output Encoding Defenses -- the context-quoting trap (PHP).
 *
 * PHP equivalent of node/context-demo/server.js -- identical three
 * routes, identical lesson: htmlspecialchars() alone does not protect
 * an unquoted HTML attribute, because it never encodes the space
 * character.
 *
 * Introduced in: Module 11.
 * Prerequisite concepts: Module 06 (Sources & Sinks).
 */

declare(strict_types=1);

function enc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$color = $_GET['color'] ?? 'blue';

header('Content-Type: text/html; charset=utf-8');

if ($path === '/') {
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 11 context demo</title></head>'
        . '<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">'
        . '<h1>Module 11 &mdash; Attribute Context Demo (PHP)</h1>'
        . '<p>Try <code>?color=red%20onmouseover=alert(1)</code> on each route below.</p>'
        . '<ul>'
        . '<li><a href="/unquoted-unencoded?color=red">unquoted-unencoded</a></li>'
        . '<li><a href="/unquoted-encoded?color=red">unquoted-encoded</a> -- STILL BROKEN</li>'
        . '<li><a href="/quoted-encoded?color=red">quoted-encoded</a> -- actually safe</li>'
        . '</ul>'
        . '</body></html>';
    exit;
}

if ($path === '/unquoted-unencoded') {
    echo "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>unquoted-unencoded</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">"
        . "<div id=\"target\" style=$color>Sample text</div></body></html>";
    exit;
}

if ($path === '/unquoted-encoded') {
    // enc() runs, but no quotes -- a space in $color still creates a
    // second, real HTML attribute, exactly as in the Node version
    $encoded = enc($color);
    echo "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>unquoted-encoded</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">"
        . "<div id=\"target\" style=$encoded>Sample text</div></body></html>";
    exit;
}

if ($path === '/quoted-encoded') {
    $encoded = enc($color);
    echo "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>quoted-encoded</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">"
        . "<div id=\"target\" style=\"$encoded\">Sample text</div></body></html>";
    exit;
}

http_response_code(404);
echo 'Not found';
