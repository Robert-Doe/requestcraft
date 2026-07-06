<?php

/**
 * router.php
 *
 * Module 14: Input Validation as Defense-in-Depth.
 *
 * PHP equivalent of node/server.js -- identical three-way comparison.
 *
 * Introduced in: Module 14.
 * Prerequisite concepts: Module 07 (Stored XSS via POST), Module 11
 * (Output Encoding Defenses).
 *
 * DO NOT copy the /blocklist route into real code.
 */

declare(strict_types=1);

function enc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function page(string $title, string $bodyHtml): string
{
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>$title</title></head>"
        . "<body style=\"font-family:sans-serif;max-width:640px;margin:40px auto;\">$bodyHtml</body></html>";
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$order = $_GET['order'] ?? 'asc';

header('Content-Type: text/html; charset=utf-8');

if ($path === '/') {
    echo page('Module 14', '
      <h1>Module 14 &mdash; Input Validation as Defense-in-Depth (PHP)</h1>
      <p>"order" should only ever be "asc" or "desc". Try
      <code>?order=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E</code> on each route:</p>
      <ul>
        <li><a href="/blocklist?order=asc">/blocklist</a></li>
        <li><a href="/allowlist?order=asc">/allowlist</a></li>
      </ul>
      <ul>
        <li><a href="/freetext?msg=hello">/freetext</a></li>
      </ul>
    ');
    exit;
}

if ($path === '/blocklist') {
    // NAIVE VALIDATION: only rejects the literal substring "<script"
    $isRejected = stripos($order, '<script') !== false;
    $value = $isRejected ? 'asc (rejected -- contained "<script")' : $order;
    echo page('blocklist', "<p>Sort order: $value</p><p><a href=\"/\">&larr; back</a></p>");
    exit;
}

if ($path === '/allowlist') {
    // REAL VALIDATION: only these two exact strings are ever accepted
    $safeOrder = ($order === 'asc' || $order === 'desc') ? $order : 'asc';
    echo page('allowlist', '<p>Sort order: ' . enc($safeOrder) . '</p><p><a href="/">&larr; back</a></p>');
    exit;
}

if ($path === '/freetext') {
    $msg = $_GET['msg'] ?? '';
    echo page('freetext', '<p>Message: ' . enc($msg) . '</p><p><a href="/">&larr; back</a></p>');
    exit;
}

http_response_code(404);
echo 'Not found';
