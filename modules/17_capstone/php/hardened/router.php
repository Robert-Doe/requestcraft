<?php

/**
 * router.php
 *
 * Module 17 Capstone: "Community Board" -- HARDENED VERSION (PHP).
 *
 * PHP equivalent of node/hardened/server.js -- identical six fixes
 * applied to the identical four bugs. See that file's header comment
 * for the full explanation of each fix.
 *
 * Introduced in: Module 17 (Capstone).
 * Prerequisite concepts: all of Modules 04-16.
 */

declare(strict_types=1);

const DATA_FILE = __DIR__ . '/posts.json';
const TOKENS_FILE = __DIR__ . '/tokens.json';
const VALID_CATEGORIES = ['general', 'question', 'announcement']; // Module 14: allowlist

function enc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function read_json(string $file, array $default): array
{
    if (!file_exists($file)) return $default;
    $decoded = json_decode(file_get_contents($file), true);
    return is_array($decoded) ? $decoded : $default;
}

function write_json(string $file, array $data): void
{
    file_put_contents($file, json_encode($data));
}

function page(string $session, string $token, string $bodyHtml): string
{
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Community Board</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:680px;margin:40px auto;\">"
        . "<h1>Community Board <small style=\"color:#888;font-size:0.5em;\">(HARDENED build, PHP)</small></h1>"
        . "<p style=\"color:#888\">Logged in as: " . enc($session) . "</p>"
        . "<form method=\"get\" action=\"/search\"><input name=\"q\" placeholder=\"search posts\"><button type=\"submit\">Search</button></form>"
        . "<form method=\"post\" action=\"/post\">"
        . "<input name=\"name\" placeholder=\"your name\" required><br><br>"
        . "<select name=\"category\"><option value=\"general\">General</option><option value=\"question\">Question</option><option value=\"announcement\">Announcement</option></select><br><br>"
        . "<textarea name=\"message\" placeholder=\"write a post\" rows=\"3\" cols=\"40\" required></textarea><br><br>"
        . "<input type=\"hidden\" name=\"csrf_token\" value=\"$token\">"
        . "<button type=\"submit\">Post</button></form>"
        . $bodyHtml
        . "</body></html>";
}

function render_posts(array $posts, string $token): string
{
    if (empty($posts)) return '<p><em>No posts yet.</em></p>';
    $html = '';
    foreach ($posts as $p) {
        $html .= "<div style=\"border:1px solid #ccc;padding:8px;margin:8px 0;\">"
            . "<span style=\"font-size:0.75em;color:#888;\">[" . enc($p['category']) . "]</span> "
            . "<strong>" . enc($p['name']) . "</strong>: " . enc($p['message'])
            . " <form method=\"post\" action=\"/delete\" style=\"display:inline\">"
            . "<input type=\"hidden\" name=\"id\" value=\"{$p['id']}\">"
            . "<input type=\"hidden\" name=\"csrf_token\" value=\"$token\">"
            . "<button type=\"submit\" style=\"color:red;font-size:0.8em;background:none;border:none;cursor:pointer;padding:0;\">[delete]</button>"
            . "</form></div>";
    }
    return $html;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$session = $_COOKIE['session'] ?? null;
if ($session === null) {
    $session = 'guest' . rand(0, 9999);
    // FIX #4
    setcookie('session', $session, ['path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
}

$tokens = read_json(TOKENS_FILE, []);
if (!isset($tokens[$session])) {
    $tokens[$session] = bin2hex(random_bytes(16)); // FIX #3, part 1
    write_json(TOKENS_FILE, $tokens);
}
$token = $tokens[$session];

// FIX #5
header("Content-Security-Policy: default-src 'self'; script-src 'self'");

$state = read_json(DATA_FILE, ['nextId' => 1, 'posts' => []]);

if ($path === '/' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: text/html; charset=utf-8');
    echo page($session, $token, '<h2>Posts</h2>' . render_posts($state['posts'], $token));
    exit;
}

if ($path === '/search' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = $_GET['q'] ?? '';
    header('Content-Type: text/html; charset=utf-8');
    // FIX #1: no blocklist at all -- real encoding, unconditionally
    echo page($session, $token, '<h2>Search results</h2><p>You searched for: ' . enc($q) . '</p>');
    exit;
}

if ($path === '/post' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // FIX #6: allowlist
    $category = in_array($_POST['category'] ?? '', VALID_CATEGORIES, true) ? $_POST['category'] : 'general';
    $state['posts'][] = [
        'id' => $state['nextId']++,
        'name' => $_POST['name'] ?? '(anonymous)',
        'message' => $_POST['message'] ?? '', // storage stays raw -- fix is at render time (FIX #2)
        'category' => $category,
    ];
    write_json(DATA_FILE, $state);
    header('Location: /');
    http_response_code(302);
    exit;
}

if ($path === '/delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // FIX #3, part 2
    if (($_POST['csrf_token'] ?? null) !== $tokens[$session]) {
        http_response_code(403);
        echo "403 Forbidden -- missing or invalid CSRF token\n";
        exit;
    }
    $id = (int) ($_POST['id'] ?? 0);
    $state['posts'] = array_values(array_filter($state['posts'], fn($p) => $p['id'] !== $id));
    write_json(DATA_FILE, $state);
    header('Location: /');
    http_response_code(302);
    exit;
}

if ($path === '/delete' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    // FIX #3, part 3: GET no longer mutates anything (Module 04)
    http_response_code(405);
    echo "405 Method Not Allowed -- delete requires POST + a valid CSRF token\n";
    exit;
}

http_response_code(404);
echo 'Not found';
