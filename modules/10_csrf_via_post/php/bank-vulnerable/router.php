<?php

/**
 * router.php (the "bank" -- naive POST-only fix, STILL VULNERABLE)
 *
 * Module 10: CSRF via POST.
 *
 * PHP equivalent of node/bank-vulnerable/server.js -- see that file's
 * header comment for the full explanation. Balances persist to
 * balances.json for the same reason earlier PHP files did.
 *
 * Introduced in: Module 10.
 * Previous module's equivalent: php/bank/router.php (Module 09).
 * Prerequisite concepts: Module 09 (CSRF via GET).
 *
 * DO NOT copy this file's /transfer handler into real code.
 * php/bank-fixed/router.php in this same module shows the real fix.
 */

declare(strict_types=1);

const DATA_FILE = __DIR__ . '/balances.json';

function read_balances(): array
{
    if (!file_exists(DATA_FILE)) return ['victim' => 1000, 'attacker' => 0];
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
    $session = 'victim';
    setcookie('session', 'victim', ['path' => '/']); // no SameSite here on purpose -- see DECISIONS.md #1
}

$balances = read_balances();

if ($path === '/' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: text/html; charset=utf-8');
    $balance = $balances[$session] ?? 0;
    echo "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Module 10 Bank (vulnerable)</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">"
        . "<h1>Module 10 &mdash; \"Bank\" (PHP, POST-only, still vulnerable)</h1>"
        . "<p>Logged in as: <strong>$session</strong> &mdash; Balance: <strong>\$$balance</strong></p>"
        . "<form method=\"post\" action=\"/transfer\">"
        . "<input type=\"hidden\" name=\"to\" value=\"someone-else\">"
        . "<input name=\"amount\" value=\"10\">"
        . "<button type=\"submit\">Send legitimate transfer</button>"
        . "</form>"
        . "<p><a href=\"/balance\">Refresh balance</a> &middot; now visit <a href=\"http://localhost:8001/\">http://localhost:8001/</a></p>"
        . "</body></html>";
    exit;
}

if ($path === '/balance' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: text/html; charset=utf-8');
    $balance = $balances[$session] ?? 0;
    echo "<p>Balance for $session: \$$balance</p><p><a href=\"/\">&larr; back</a></p>";
    exit;
}

if ($path === '/transfer') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo "405 Method Not Allowed -- this \"fix\" only requires POST\n";
        exit;
    }
    // THE REMAINING VULNERABILITY: POST is required, but nothing checks
    // WHERE the request came from, and nothing requires a value the
    // attacker couldn't already know (see DECISIONS.md #2)
    $to = $_POST['to'] ?? 'attacker';
    $amount = (int) ($_POST['amount'] ?? 0);
    $balances[$session] = ($balances[$session] ?? 0) - $amount;
    $balances[$to] = ($balances[$to] ?? 0) + $amount;
    write_balances($balances);
    error_log("[transfer] $session -> $to: \$$amount (POST, but no CSRF token checked)");
    header('Content-Type: text/plain');
    echo "Transferred \$$amount from $session to $to\n";
    exit;
}

http_response_code(404);
echo 'Not found';
