<?php

/**
 * target.php
 *
 * Module 16: Testing Methodology & Payload Craft.
 *
 * PHP equivalent of node/target.js -- identical naive filter (strip the
 * word "script", case-insensitive, in one pass) and identical unescaped
 * reflection otherwise.
 *
 * Introduced in: Module 16.
 * Prerequisite concepts: Module 07 (Stored XSS via POST) Brain Exercise,
 * Module 14 (Input Validation as Defense-in-Depth).
 *
 * DO NOT copy this file's filter into real code.
 */

declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/search') {
    $q = $_GET['q'] ?? '';
    // THE "FIX" THAT ISN'T -- single-pass removal of the word "script"
    $filtered = preg_replace('/script/i', '', $q);

    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Module 16 target</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">"
        . "<h1>Module 16 &mdash; Test Target (PHP)</h1>"
        . "<p>You searched for: $filtered</p>"
        . "</body></html>";
    exit;
}

http_response_code(404);
echo 'Not found';
