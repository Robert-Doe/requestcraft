<?php

/**
 * raw_server.php
 *
 * PHP equivalent of node/raw_server.js -- opens a raw TCP listener
 * and prints every byte a client sends, unparsed. Same concept,
 * same Module 01 of the xss_mastery course, different runtime.
 *
 * Introduced in: Module 01 (first file in the course -- no previous
 * module's equivalent exists).
 *
 * Prerequisite concepts: none beyond "a TCP socket carries bytes."
 *
 * NOTE: This file requires a working `php` binary on PATH to run.
 * If PHP isn't installed on your machine yet, use node/raw_server.js
 * instead -- it demonstrates the exact same concept and runs right now.
 */

declare(strict_types=1);

const PORT = 8000;              // same arbitrary unprivileged port as the Node version
const READ_BUFFER_BYTES = 8192; // 8 KB -- see DECISIONS.md #3 for why this size

/*
 * open_listener -- creates a raw TCP server socket bound to localhost.
 *
 * returns: a stream resource representing the listening socket
 * Assumes: PORT is free -- if something else is already listening on
 *          8000 (e.g. the Node version left running), this will fail.
 */
function open_listener()
{
    $errno = 0;
    $errstr = '';

    // stream_socket_server is PHP's raw-socket API -- one level below
    // the built-in dev server (php -S) you'll use starting Module 02
    $server = stream_socket_server(
        'tcp://127.0.0.1:' . PORT,
        $errno,
        $errstr
    );

    if ($server === false) {
        // Caller must not proceed -- there is no listener to accept() on
        fwrite(STDERR, "Could not bind to port: $errstr ($errno)\n");
        exit(1);
    }

    return $server;
}

/*
 * handle_connection -- reads and prints one client's raw request bytes.
 *
 * $client: the accepted connection stream
 * returns: void -- side effect only (printing), same contract as the Node version
 *
 * Assumes: the caller only invokes this after accepting exactly one
 *          connection -- see the accept loop at the bottom of this file.
 */
function handle_connection($client): void
{
    // fread with a byte cap is PHP's equivalent of Node's single 'data'
    // event -- we take one read and treat it as the whole request,
    // same simplification as the Node version (see DECISIONS.md #3)
    $raw = fread($client, READ_BUFFER_BYTES);

    echo "--- RAW BYTES RECEIVED ---\n";
    echo $raw;                     // unparsed, exactly as received -- see DECISIONS.md #2
    echo "--- END ---\n\n";

    // Minimal valid response so curl completes cleanly -- plumbing,
    // not the concept being taught (identical rationale to the Node file)
    $body = "seen\n";
    fwrite(
        $client,
        "HTTP/1.1 200 OK\r\n" .
        "Content-Type: text/plain\r\n" .
        'Content-Length: ' . strlen($body) . "\r\n" .
        "\r\n" .
        $body
    );

    fclose($client); // one request per connection at this stage, same as Node
}

$server = open_listener();
echo 'Raw TCP listener up on http://localhost:' . PORT . "\n";
echo "Send it a GET and a POST with curl and watch the raw bytes appear.\n\n";

// Single-connection-at-a-time loop -- accept() blocks here until a client
// connects, so unlike Node's event loop, PHP's version is *naturally*
// sequential rather than needing an explicit "busy" flag (contrast with
// the Node file's acceptingConnections flag -- same outcome, different
// underlying reason; see DECISIONS.md #4)
while ($client = stream_socket_accept($server, -1)) {
    handle_connection($client);
}
