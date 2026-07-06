<?php

/**
 * router.php
 *
 * Module 07: Stored XSS via POST.
 *
 * PHP equivalent of node/server.js -- DELIBERATELY VULNERABLE. Comments
 * are persisted to comments.json (same reasoning as Module 04's PHP
 * counter: PHP's built-in dev server re-runs this script from scratch on
 * every request, so state has to live outside the script itself).
 *
 * Introduced in: Module 07.
 * Previous module's equivalent: php/router.php (Module 05).
 * Prerequisite concepts: Module 05 (Reflected XSS via GET), Module 06
 * (Sources & Sinks), Module 04 (Idempotency & Safety) for the
 * file-persistence pattern reused here.
 *
 * DO NOT copy this file's comment-rendering code into real code.
 * Module 11 (Output Encoding Defenses) comes back and fixes this exact file.
 */

declare(strict_types=1);

const DATA_FILE = __DIR__ . '/comments.json';

function read_comments(): array
{
    if (!file_exists(DATA_FILE)) {
        return [];
    }
    $decoded = json_decode(file_get_contents(DATA_FILE), true);
    return is_array($decoded) ? $decoded : [];
}

function write_comments(array $comments): void
{
    file_put_contents(DATA_FILE, json_encode($comments));
}

/*
 * render_guestbook -- builds the full guestbook page from stored comments.
 *
 * comments: array of ['name' => string, 'message' => string]
 * returns: a full HTML document string
 *
 * THIS FUNCTION IS THE VULNERABILITY -- see node/server.js's matching
 * function for the full explanation. Same bug, same shape, same fix
 * deferred to Module 11.
 */
function render_guestbook(array $comments): string
{
    $commentsHtml = '';
    foreach ($comments as $c) {
        // No htmlspecialchars() here -- $c['name'] and $c['message'] go
        // straight into the page exactly as they were submitted
        $commentsHtml .= '<div style="border:1px solid #ccc; padding:8px; margin:8px 0;">'
            . "<strong>{$c['name']}</strong>: {$c['message']}"
            . '</div>';
    }
    if ($commentsHtml === '') {
        $commentsHtml = '<p><em>No comments yet -- be the first.</em></p>';
    }

    $count = count($comments);
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 07 Guestbook</title></head>'
        . '<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">'
        . '<h1>Module 07 &mdash; Guestbook (Stored XSS via POST) (PHP)</h1>'
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
$method = $_SERVER['REQUEST_METHOD'];

if ($path === '/comment' && $method === 'POST') {
    $comments = read_comments();
    // Stored exactly as submitted -- no encoding, no validation, no
    // length limit (see DECISIONS.md)
    $comments[] = [
        'name' => $_POST['name'] ?? '(anonymous)',
        'message' => $_POST['message'] ?? '',
    ];
    write_comments($comments);
    error_log('[comment] stored: name=' . json_encode($_POST['name'] ?? '') . ' message=' . json_encode($_POST['message'] ?? ''));
    header('Location: /');
    http_response_code(302);
    exit;
}

if ($path === '/' && $method === 'GET') {
    header('Content-Type: text/html; charset=utf-8');
    echo render_guestbook(read_comments());
    exit;
}

http_response_code(404);
echo 'Not found';
