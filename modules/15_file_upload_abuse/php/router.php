<?php

/**
 * router.php
 *
 * Module 15: File Upload Abuse.
 *
 * PHP equivalent of node/server.js. Unlike Node, PHP's SAPI already
 * parses multipart/form-data for you into the $_FILES superglobal --
 * there is no hand-rolled parser here, for the same reason Module 11
 * used htmlspecialchars() directly in PHP: the platform already ships
 * a correct, native implementation (see DECISIONS.md #2).
 *
 * Introduced in: Module 15.
 * Prerequisite concepts: Module 02 (Superglobals & req Objects),
 * Module 14 (Input Validation as Defense-in-Depth).
 *
 * DO NOT copy /upload-vulnerable into real code.
 */

declare(strict_types=1);

const VULN_DIR = __DIR__ . '/uploads-vulnerable';
const FIXED_DIR = __DIR__ . '/uploads-fixed';

/*
 * detect_real_image_type -- inspects actual file bytes, ignoring any
 * claimed extension or Content-Type.
 *
 * data: the raw uploaded file bytes
 * returns: 'png' | 'jpg' | 'gif' | null
 */
function detect_real_image_type(string $data): ?string
{
    if (str_starts_with($data, "\x89PNG")) return 'png';
    if (str_starts_with($data, "\xFF\xD8\xFF")) return 'jpg';
    if (str_starts_with($data, 'GIF87a') || str_starts_with($data, 'GIF89a')) return 'gif';
    return null;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Module 15</title></head>'
        . '<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">'
        . '<h1>Module 15 &mdash; File Upload Abuse (PHP)</h1>'
        . '<form method="post" action="/upload-vulnerable" enctype="multipart/form-data">'
        . '<p>Vulnerable upload: <input type="file" name="avatar"><button type="submit">Upload (vulnerable)</button></p>'
        . '</form>'
        . '<form method="post" action="/upload-fixed" enctype="multipart/form-data">'
        . '<p>Fixed upload: <input type="file" name="avatar"><button type="submit">Upload (fixed)</button></p>'
        . '</form>'
        . '</body></html>';
    exit;
}

if ($path === '/upload-vulnerable' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['avatar'])) {
        http_response_code(400);
        echo "No file uploaded\n";
        exit;
    }
    // THE VULNERABILITY: the client-supplied original name (and its
    // extension) and the client-supplied 'type' are both trusted
    // completely. basename() only prevents path traversal -- it is NOT
    // the fix (see Node version's DECISIONS.md #6).
    $safeName = basename($_FILES['avatar']['name']);
    $claimedType = $_FILES['avatar']['type'];
    move_uploaded_file($_FILES['avatar']['tmp_name'], VULN_DIR . '/' . $safeName);
    error_log("[upload-vulnerable] saved \"$safeName\" -- claimed Content-Type: $claimedType");
    echo "Saved as $safeName (trusted claimed extension + Content-Type: $claimedType)\n";
    exit;
}

if ($path === '/upload-fixed' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['avatar'])) {
        http_response_code(400);
        echo "No file uploaded\n";
        exit;
    }
    // THE FIX: read the actual bytes and detect the real type. The
    // client's filename and 'type' field are never consulted for this decision.
    $data = file_get_contents($_FILES['avatar']['tmp_name']);
    $realType = detect_real_image_type($data);

    if ($realType === null) {
        error_log('[upload-fixed] REJECTED -- claimed "' . $_FILES['avatar']['name'] . '" (' . $_FILES['avatar']['type'] . ') is not a real image by content');
        http_response_code(415);
        echo "415 Unsupported Media Type -- file content is not a recognized image format\n";
        exit;
    }

    // Server generates its own filename with the DETECTED extension
    $generatedName = bin2hex(random_bytes(8)) . '.' . $realType;
    move_uploaded_file($_FILES['avatar']['tmp_name'], FIXED_DIR . '/' . $generatedName);
    error_log("[upload-fixed] saved as \"$generatedName\" -- detected real type: $realType");
    echo "Saved as $generatedName (detected real type: $realType)\n";
    exit;
}

http_response_code(404);
echo 'Not found';
