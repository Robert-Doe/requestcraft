<?php

/**
 * router.php
 *
 * Module 17 Capstone: "Community Board" -- VULNERABLE VERSION (PHP).
 *
 * PHP equivalent of node/vulnerable/server.js -- identical four bugs.
 * Posts persist to posts.json for the same reason every prior PHP
 * file in this course has (PHP's built-in server re-runs the script
 * from scratch on every request).
 *
 * Introduced in: Module 17 (Capstone).
 * Prerequisite concepts: all of Modules 04-16.
 *
 * DO NOT copy any part of this file into real code.
 */

declare(strict_types=1);

const DATA_FILE = __DIR__ . '/posts.json';

function read_posts(): array
{
    if (!file_exists(DATA_FILE)) return ['nextId' => 1, 'posts' => []];
    $decoded = json_decode(file_get_contents(DATA_FILE), true);
    return is_array($decoded) ? $decoded : ['nextId' => 1, 'posts' => []];
}

function write_posts(array $state): void
{
    file_put_contents(DATA_FILE, json_encode($state));
}

// BUG #1: naive word-removal filter, single pass -- see Module 16
function naive_filter(string $q): string
{
    return preg_replace('/script/i', '', $q);
}

function page(string $session, string $bodyHtml): string
{
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Community Board</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:680px;margin:40px auto;\">"
        . "<h1>Community Board <small style=\"color:#888;font-size:0.5em;\">(VULNERABLE build, PHP)</small></h1>"
        . "<p style=\"color:#888\">Logged in as: $session</p>"
        . "<form method=\"get\" action=\"/search\"><input name=\"q\" placeholder=\"search posts\"><button type=\"submit\">Search</button></form>"
        . "<form method=\"post\" action=\"/post\">"
        . "<input name=\"name\" placeholder=\"your name\" required><br><br>"
        . "<textarea name=\"message\" placeholder=\"write a post\" rows=\"3\" cols=\"40\" required></textarea><br><br>"
        . "<button type=\"submit\">Post</button></form>"
        . $bodyHtml
        . "</body></html>";
}

function render_posts(array $posts): string
{
    if (empty($posts)) return '<p><em>No posts yet.</em></p>';
    $html = '';
    foreach ($posts as $p) {
        // BUG #2: no encoding at all
        $html .= "<div style=\"border:1px solid #ccc;padding:8px;margin:8px 0;\">"
            . "<strong>{$p['name']}</strong>: {$p['message']}"
            // BUG #3: delete is a plain GET link, no CSRF protection
            . " <a href=\"/delete?id={$p['id']}\" style=\"color:red;font-size:0.8em;\">[delete]</a>"
            . "</div>";
    }
    return $html;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$session = $_COOKIE['session'] ?? null;
if ($session === null) {
    $session = 'guest' . rand(0, 9999);
    // BUG #4: no httponly, no samesite
    setcookie('session', $session, ['path' => '/']);
}

$state = read_posts();

if ($path === '/' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: text/html; charset=utf-8');
    echo page($session, '<h2>Posts</h2>' . render_posts($state['posts']));
    exit;
}

if ($path === '/search' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = $_GET['q'] ?? '';
    $filtered = naive_filter($q); // BUG #1's filter -- looks like a fix, isn't
    header('Content-Type: text/html; charset=utf-8');
    // BUG #1 continued: written completely unescaped
    echo page($session, "<h2>Search results</h2><p>You searched for: $filtered</p>");
    exit;
}

if ($path === '/post' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $state['posts'][] = [
        'id' => $state['nextId']++,
        'name' => $_POST['name'] ?? '(anonymous)',
        'message' => $_POST['message'] ?? '', // BUG #2: stored raw
    ];
    write_posts($state);
    header('Location: /');
    http_response_code(302);
    exit;
}

if ($path === '/delete' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    // BUG #3: plain GET, no ownership check, no CSRF token
    $id = (int) ($_GET['id'] ?? 0);
    $state['posts'] = array_values(array_filter($state['posts'], fn($p) => $p['id'] !== $id));
    write_posts($state);
    error_log("[delete] post $id removed via plain GET, no confirmation, no CSRF check");
    header('Location: /');
    http_response_code(302);
    exit;
}

http_response_code(404);
echo 'Not found';
