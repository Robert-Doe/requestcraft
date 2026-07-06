<?php

/**
 * router.php (the "bank" -- FIXED: CSRF token + SameSite cookie)
 *
 * Module 10: CSRF via POST.
 *
 * PHP equivalent of node/bank-fixed/server.js -- see that file's header
 * comment for the full explanation of both defenses layered here.
 *
 * Introduced in: Module 10.
 * Previous module's equivalent: php/bank-vulnerable/router.php (this module).
 * Prerequisite concepts: Module 09 (CSRF via GET).
 */

declare(strict_types=1);

const DATA_FILE = __DIR__ . '/balances.json';
const TOKENS_FILE = __DIR__ . '/tokens.json';

function read_json_file(string $file, array $default): array
{
    if (!file_exists($file)) return $default;
    $decoded = json_decode(file_get_contents($file), true);
    return is_array($decoded) ? $decoded : $default;
}

function write_json_file(string $file, array $data): void
{
    file_put_contents($file, json_encode($data));
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$session = $_COOKIE['session'] ?? null;
if ($session === null) {
    $session = 'victim';
    // SameSite=Strict is DEFENSE #2 -- see the Node version's comment for why
    setcookie('session', 'victim', ['path' => '/', 'samesite' => 'Strict']);
}

$balances = read_json_file(DATA_FILE, ['victim' => 1000, 'attacker' => 0]);
$tokens = read_json_file(TOKENS_FILE, []);

if (!isset($tokens[$session])) {
    // Random, unguessable, per-session -- DEFENSE #1
    $tokens[$session] = bin2hex(random_bytes(16));
    write_json_file(TOKENS_FILE, $tokens);
}

if ($path === '/' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: text/html; charset=utf-8');
    $balance = $balances[$session] ?? 0;
    $token = $tokens[$session];
    echo "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Module 10 Bank (fixed)</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">"
        . "<h1>Module 10 &mdash; \"Bank\" (PHP, FIXED: CSRF token + SameSite)</h1>"
        . "<p>Logged in as: <strong>$session</strong> &mdash; Balance: <strong>\$$balance</strong></p>"
        . "<form method=\"post\" action=\"/transfer\">"
        . "<input type=\"hidden\" name=\"to\" value=\"someone-else\">"
        . "<input type=\"hidden\" name=\"csrf_token\" value=\"$token\">"
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
        echo "405 Method Not Allowed\n";
        exit;
    }

    // DEFENSE #1 in action: reject unless the submitted token matches
    // exactly what this session was issued
    $submittedToken = $_POST['csrf_token'] ?? null;
    if ($submittedToken !== $tokens[$session]) {
        error_log('[transfer] REJECTED -- csrf_token mismatch (got ' . json_encode($submittedToken) . ')');
        http_response_code(403);
        echo "403 Forbidden -- missing or invalid CSRF token\n";
        exit;
    }

    $to = $_POST['to'] ?? 'attacker';
    $amount = (int) ($_POST['amount'] ?? 0);
    $balances[$session] = ($balances[$session] ?? 0) - $amount;
    $balances[$to] = ($balances[$to] ?? 0) + $amount;
    write_json_file(DATA_FILE, $balances);
    error_log("[transfer] $session -> $to: \$$amount (valid CSRF token)");
    header('Content-Type: text/plain');
    echo "Transferred \$$amount from $session to $to\n";
    exit;
}

http_response_code(404);
echo 'Not found';
