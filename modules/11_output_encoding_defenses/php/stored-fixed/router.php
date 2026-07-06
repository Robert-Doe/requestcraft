<?php

/**
 * router.php
 *
 * Module 11: Output Encoding Defenses (fixing Module 07).
 *
 * Module 07's exact guestbook, with comments encoded via
 * htmlspecialchars(..., ENT_QUOTES, 'UTF-8') at render time only.
 * Storage remains untouched, exactly as submitted (see Node version's
 * DECISIONS.md #1).
 *
 * Introduced in: Module 11.
 * Previous module's equivalent: php/router.php (Module 07).
 * Prerequisite concepts: Module 07 (Stored XSS via POST).
 */

declare(strict_types=1);

const DATA_FILE = __DIR__ . '/comments.json';

function enc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

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
        // THIS is the entire fix compared to Module 07: enc() wraps
        // both fields, at render time, unconditionally
        $commentsHtml .= '<div style="border:1px solid #ccc; padding:8px; margin:8px 0;">'
            . '<strong>' . enc($c['name']) . '</strong>: ' . enc($c['message'])
            . '</div>';
    }
    if ($commentsHtml === '') {
        $commentsHtml = '<p><em>No comments yet -- be the first.</em></p>';
    }
    $count = count($comments);
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 11 Guestbook (fixed)</title></head>'
        . '<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">'
        . '<h1>Module 11 &mdash; Guestbook (PHP, FIXED)</h1>'
        . '<form method="post" action="/comment">'
        . '<input name="name" placeholder="your name" required><br><br>'
        . '<textarea name="message" placeholder="leave a message" rows="3" cols="40" required></textarea><br><br>'
        . '<button type="submit">Post comment</button>'
        . '</form>'
        . "<h2>Comments ($count)</h2>"
        . $commentsHtml
        . '</body></html>';
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/comment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $comments = read_comments();
    // Storage UNCHANGED from Module 07 -- still raw. Fix lives entirely
    // in render_guestbook() above.
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
