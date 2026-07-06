<?php

/**
 * router.php
 *
 * Module 04: Idempotency & Safety.
 *
 * PHP equivalent of node/server.js. The concept is identical -- an
 * "unsafe" counter incremented by GET, and a "safe" counter that only
 * accepts POST -- but the storage mechanism is different on purpose:
 * PHP's built-in dev server re-runs this entire script from scratch on
 * every request, so a plain PHP variable can't hold the counter between
 * requests the way Node's in-memory variable can. This file persists
 * the counts to a small JSON file instead (see DECISIONS.md #1).
 *
 * Introduced in: Module 04.
 * Previous module's equivalent: php/router.php (Module 03).
 * Prerequisite concepts: Module 03 (Forms & Method Semantics).
 */

declare(strict_types=1);

const DATA_FILE = __DIR__ . '/counts.json'; // survives between requests -- see DECISIONS.md #1

/*
 * read_counts -- loads the current counter values from disk.
 *
 * returns: an array with 'unsafe' and 'safe' integer keys
 * Assumes: if the file is missing or corrupt, starting over at zero is
 *          an acceptable recovery -- this is a teaching demo, not a
 *          system where losing a counter value has real consequences.
 */
function read_counts(): array
{
    if (!file_exists(DATA_FILE)) {
        return ['unsafe' => 0, 'safe' => 0];
    }
    $decoded = json_decode(file_get_contents(DATA_FILE), true);
    return is_array($decoded) ? $decoded : ['unsafe' => 0, 'safe' => 0];
}

/*
 * write_counts -- saves the current counter values to disk.
 *
 * counts: the array to persist
 * returns: void
 * Note: no file locking is used here -- see DECISIONS.md #6 for why
 *       that's an accepted gap at this stage, not an oversight.
 */
function write_counts(array $counts): void
{
    file_put_contents(DATA_FILE, json_encode($counts));
}

/*
 * page -- renders the counter page, identical in structure to the Node version.
 *
 * counts: the current counter values to display
 * returns: a full HTML document string
 */
function page(array $counts): string
{
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 04</title></head>'
        . '<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">'
        . '<h1>Module 04 &mdash; Idempotency &amp; Safety (PHP)</h1>'
        . '<h2>Unsafe counter (GET-triggered): ' . $counts['unsafe'] . '</h2>'
        . '<p><a href="/unsafe-increment">Click to increment (GET)</a></p>'
        . '<img src="/unsafe-increment" style="display:none" alt="">'
        . '<h2>Safe counter (POST-only): ' . $counts['safe'] . '</h2>'
        . '<form method="post" action="/safe-increment"><button type="submit">Increment (POST)</button></form>'
        . '<img src="/safe-increment" style="display:none" alt="">'
        . '<p><a href="/">&#8635; reload to see current counts</a></p>'
        . '</body></html>';
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if ($path === '/unsafe-increment' && $method === 'GET') {
    $counts = read_counts();
    $counts['unsafe']++;              // the entire bug lives in this one line responding to GET
    write_counts($counts);
    error_log("[unsafe-increment] now {$counts['unsafe']} (triggered by a GET request)");
    header('Location: /');
    http_response_code(302);
    exit;
}

if ($path === '/safe-increment') {
    if ($method !== 'POST') {
        http_response_code(405);
        header('Content-Type: text/plain');
        echo "405 Method Not Allowed -- this endpoint only accepts POST, on purpose (see Module 04)\n";
        exit;
    }
    $counts = read_counts();
    $counts['safe']++;
    write_counts($counts);
    error_log("[safe-increment] now {$counts['safe']} (triggered by a POST request)");
    header('Location: /');
    http_response_code(302);
    exit;
}

if ($path === '/' && $method === 'GET') {
    header('Content-Type: text/html; charset=utf-8');
    echo page(read_counts());
    exit;
}

http_response_code(404);
echo 'Not found';
