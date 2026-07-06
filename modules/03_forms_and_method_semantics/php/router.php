<?php

/**
 * router.php
 *
 * Module 03: Forms & Method Semantics.
 *
 * PHP equivalent of node/server.js -- serves the same two forms and
 * shows the same GET-vs-POST address-bar behavior, using $_GET/$_POST
 * exactly as Module 02 introduced them, plus a simulated access log
 * line printed for every request.
 *
 * Introduced in: Module 03.
 * Previous module's equivalent: php/router.php (Module 02).
 * Prerequisite concepts: Module 02 (Superglobals & req Objects).
 */

declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$queryString = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY) ?? '';

// Same blind spot a real access log has: query string shows, body never does
$logLine = '[ACCESS LOG] ' . $_SERVER['REQUEST_METHOD'] . ' ' . $path
    . ($queryString !== '' ? '?' . $queryString : '');
error_log($logLine);

/*
 * page -- wraps a body fragment in a minimal HTML document.
 *
 * title: the <title> text
 * bodyHtml: the HTML to place inside <body>
 * returns: a full HTML document string
 */
function page(string $title, string $bodyHtml): string
{
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>$title</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">$bodyHtml</body></html>";
}

header('Content-Type: text/html; charset=utf-8');

if ($path === '/' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    echo page('Module 03', '
      <h1>Module 03 &mdash; Forms &amp; Method Semantics (PHP)</h1>
      <h2>Form A &mdash; method="get"</h2>
      <form method="get" action="/search">
        <input name="q" placeholder="search term">
        <button type="submit">Search (GET)</button>
      </form>
      <h2>Form B &mdash; method="post"</h2>
      <form method="post" action="/comment">
        <input name="message" placeholder="leave a message">
        <button type="submit">Post (POST)</button>
      </form>
      <p>Submit each one, then look at your address bar and compare.</p>
    ');
    exit;
}

if ($path === '/search' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = $_GET['q'] ?? '(empty)'; // straight from the superglobal Module 02 introduced
    echo page('Search result', "
      <p>You searched for: <strong>$q</strong></p>
      <p>Look at your address bar right now -- it shows <code>?q=$q</code>.</p>
      <p><a href=\"/\">&larr; back</a></p>
    ");
    exit;
}

if ($path === '/comment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $message = $_POST['message'] ?? '(empty)'; // straight from the superglobal Module 02 introduced
    echo page('Comment posted', "
      <p>You posted: <strong>$message</strong></p>
      <p>Your address bar still just says <code>/comment</code> -- check your
      terminal too: the access log line for this request has no query string.</p>
      <p><a href=\"/\">&larr; back</a></p>
    ");
    exit;
}

http_response_code(404);
echo 'Not found';
