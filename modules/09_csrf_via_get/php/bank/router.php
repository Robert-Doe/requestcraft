<?php

/**
 * router.php (the "bank")
 *
 * Module 09: CSRF via GET.
 *
 * PHP equivalent of node/bank/server.js -- DELIBERATELY VULNERABLE.
 * Balances persist to balances.json for the same reason Module 04's PHP
 * counter did: PHP's built-in server re-runs this script from scratch
 * on every request.
 *
 * Introduced in: Module 09.
 * Previous module's equivalent: php/router.php (Module 04) for the
 * persistence pattern; this is the first PHP file split into a
 * bank/attacker pair.
 * Prerequisite concepts: Module 04 (Idempotency & Safety).
 *
 * DO NOT copy this file's /transfer handler into real code.
 */

declare(strict_types=1);

const DATA_FILE = __DIR__ . '/balances.json';

function read_balances(): array
{
    if (!file_exists(DATA_FILE)) {
        return ['victim' => 1000, 'attacker' => 0];
    }
    $decoded = json_decode(file_get_contents(DATA_FILE), true);
    return is_array($decoded) ? $decoded : ['victim' => 1000, 'attacker' => 0];
}

function write_balances(array $balances): void
{
    file_put_contents(DATA_FILE, json_encode($balances));
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$session = $_COOKIE['session'] ?? null;
if ($session === null) {
    // Simulate "already logged in" on first visit -- see Node version's
    // DECISIONS.md #1 for why a real login form is out of scope here
    $session = 'victim';
    setcookie('session', 'victim', ['path' => '/']);
}

$balances = read_balances();

if ($path === '/' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: text/html; charset=utf-8');
    $balance = $balances[$session] ?? 0;
    echo "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Module 09 Bank</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">"
        . "<h1>Module 09 &mdash; \"Bank\" (PHP, victim site, port 8000)</h1>"
        . "<p>Logged in as: <strong>$session</strong></p>"
        . "<p>Balance: <strong>\$$balance</strong></p>"
        . "<p><a href=\"/balance\">Refresh balance</a></p>"
        . "<p style=\"color:#888\">Now, in a NEW TAB, visit the attacker site at "
        . "<a href=\"http://localhost:8001/\">http://localhost:8001/</a> -- then come back here.</p>"
        . "</body></html>";
    exit;
}

if ($path === '/balance' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: text/html; charset=utf-8');
    $balance = $balances[$session] ?? 0;
    echo "<p>Balance for $session: \$$balance</p><p><a href=\"/\">&larr; back</a></p>";
    exit;
}

if ($path === '/transfer' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $to = $_GET['to'] ?? 'attacker';
    $amount = (int) ($_GET['amount'] ?? 0);

    // THE VULNERABILITY: authenticated ONLY by a cookie the browser
    // attaches automatically -- no check on where the request came from
    $balances[$session] = ($balances[$session] ?? 0) - $amount;
    $balances[$to] = ($balances[$to] ?? 0) + $amount;
    write_balances($balances);
    error_log("[transfer] $session -> $to: \$$amount (GET request, cookie-authenticated only)");

    header('Content-Type: text/plain');
    echo "Transferred \$$amount from $session to $to\n";
    exit;
}

http_response_code(404);
echo 'Not found';
