<?php

/**
 * router.php (the "guestbook" -- session cookie WITH HttpOnly + SameSite)
 *
 * Module 13: Cookie & Session Hardening.
 *
 * PHP equivalent of node/fixed-cookie/server.js -- identical unfixed
 * stored-XSS bug, hardened cookie.
 *
 * Introduced in: Module 13.
 * Previous module's equivalent: php/vulnerable-cookie/router.php (this module).
 * Prerequisite concepts: Module 07 (Stored XSS via POST).
 */

declare(strict_types=1);

const DATA_FILE = __DIR__ . '/comments.json';

function read_comments(): array
{
    if (!file_exists(DATA_FILE)) return [];
    $decoded = json_decode(file_get_contents(DATA_FILE), true);
    return is_array($decoded) ? $decoded : [];
}

function write_comments(array $comments): void
{
    file_put_contents(DATA_FILE, json_encode($comments));
}

function render_guestbook(array $comments): string
{
    $commentsHtml = '';
    foreach ($comments as $c) {
        $commentsHtml .= '<div style="border:1px solid #ccc; padding:8px; margin:8px 0;">'
            . "<strong>{$c['name']}</strong>: {$c['message']}"
            . '</div>';
    }
    if ($commentsHtml === '') $commentsHtml = '<p><em>No comments yet -- be the first.</em></p>';
    $count = count($comments);
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Module 13 Guestbook (fixed cookie)</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">"
        . "<h1>Module 13 &mdash; Guestbook (PHP, session cookie WITH HttpOnly)</h1>"
        . "<p style=\"color:#888\">document.cookie in this page's console will NOT show the session cookie at all.</p>"
        . "<form method=\"post\" action=\"/comment\">"
        . "<input name=\"name\" placeholder=\"your name\" required><br><br>"
        . "<textarea name=\"message\" placeholder=\"leave a message\" rows=\"3\" cols=\"40\" required></textarea><br><br>"
        . "<button type=\"submit\">Post comment</button>"
        . "</form>"
        . "<h2>Comments ($count)</h2>"
        . $commentsHtml
        . "</body></html>";
}

if (!isset($_COOKIE['session'])) {
    // THE FIX: httponly => true makes this invisible to document.cookie.
    // samesite => Lax is a bonus hardening flag reused from Module 10.
    setcookie('session', 'SECRET-abc123', [
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/comment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $comments = read_comments();
    $comments[] = ['name' => $_POST['name'] ?? '(anonymous)', 'message' => $_POST['message'] ?? ''];
    write_comments($comments);
    header('Location: /');
    http_response_code(302);
    exit;
}

if ($path === '/' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: text/html; charset=utf-8');
    echo render_guestbook(read_comments());
    exit;
}

http_response_code(404);
echo 'Not found';
