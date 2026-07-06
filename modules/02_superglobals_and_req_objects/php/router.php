<?php

/**
 * router.php
 *
 * Module 02: Superglobals & req Objects.
 *
 * Run with `php -S localhost:8000 router.php`. PHP's built-in dev
 * server has already done the parsing work Module 01 built by hand
 * in raw_server.php -- $_GET and $_POST arrive pre-parsed before this
 * script even runs. This file exists to make that parsing VISIBLE, by
 * dumping exactly what PHP handed you, so you can compare it directly
 * to Module 01's raw bytes.
 *
 * Introduced in: Module 02.
 * Previous module's equivalent: php/raw_server.php (Module 01) -- that
 * file printed raw bytes by hand; PHP's SAPI now does that parsing
 * job for you, invisibly, before your script starts.
 * Prerequisite concepts: Module 01 (HTTP Request Anatomy).
 */

declare(strict_types=1);

// $_SERVER['REQUEST_METHOD'] is PHP's equivalent of Node's req.method --
// notice it's a superglobal too, not something you had to parse yourself
$dump = [
    'method' => $_SERVER['REQUEST_METHOD'],
    // strip the query string back off REQUEST_URI, for a clean comparison
    // to the 'path' field the Node version prints
    'path'   => parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH),
    'GET'    => $_GET,   // populated by PHP itself from the query string -- this IS the concept this module makes visible
    'POST'   => $_POST,  // populated by PHP itself from the body, but ONLY for form-encoded/multipart content types (see DECISIONS.md #4)
];

$json = json_encode($dump, JSON_PRETTY_PRINT);

// Print to the server's own console (visible in the terminal running
// `php -S`) as well as sending it back in the response, mirroring the
// Node version's dual output
error_log($json);

header('Content-Type: application/json');
echo $json . "\n";
