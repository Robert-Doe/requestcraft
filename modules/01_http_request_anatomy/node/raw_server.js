/*
 * raw_server.js
 *
 * Opens a raw TCP listener on port 8000 and prints every byte it
 * receives, completely unparsed -- no HTTP method extraction, no
 * header split, no body extraction. This is the file for Module 01:
 * HTTP Request Anatomy, of the xss_mastery course.
 *
 * Introduced in: Module 01 (this is the first file in the course --
 * there is no previous module's equivalent).
 *
 * Prerequisite concepts: none beyond "a TCP socket carries bytes,
 * and a web request is just bytes sent to a port." That's it --
 * this file exists specifically so you don't have to take that
 * claim on faith.
 */

'use strict';

const net = require('net'); // Node's raw TCP module -- one level below the 'http' module you'll use from Module 02 onward

const PORT = 8000;              // arbitrary unprivileged port -- ports below 1024 need admin rights on most OSes
const READ_BUFFER_BYTES = 8192; // 8 KB -- comfortably larger than any GET/POST this course's demos will send (see DECISIONS.md #3)

/*
 * handleConnection -- prints every byte a single client sends, then closes.
 *
 * socket: the raw net.Socket Node hands you when a client connects
 * returns: nothing -- this function's job is entirely side effects (printing)
 *
 * Assumes: only one client is "active" at a time (see acceptingConnections
 * below) -- this function does not defend against concurrent access itself.
 * Note: it does NOT wait for a fixed number of bytes or a terminator --
 * it prints whatever arrived in the first 'data' event and stops there,
 * which is honest about what Module 01 does and does not know yet.
 */
function handleConnection(socket) {
  // 'data' fires once per chunk of bytes the OS hands back to us --
  // for our tiny curl requests, that's almost always exactly one event
  socket.on('data', (chunk) => {
    // chunk is a Buffer -- raw bytes, not yet a JS string.
    // toString() decodes it as UTF-8 text purely so we can print it;
    // a real parser would NOT assume the body is always UTF-8 text.
    const raw = chunk.toString('utf8');

    console.log('--- RAW BYTES RECEIVED ---');
    console.log(raw);                 // print it completely unparsed -- see DECISIONS.md #2
    console.log('--- END ---\n');

    // Send back a minimal valid HTTP response so curl doesn't hang
    // or print a connection-reset error -- this is NOT the concept
    // being taught here, just plumbing so the demo feels complete.
    socket.write(
      'HTTP/1.1 200 OK\r\n' +
      'Content-Type: text/plain\r\n' +
      'Content-Length: 5\r\n' +
      '\r\n' +
      'seen\n'
    );
    socket.end(); // close this connection -- we only handle one request per connection at this stage
  });

  socket.on('error', (err) => {
    // A client can disconnect mid-read (closed terminal, curl --max-time, etc.).
    // We only log it -- there's no state to roll back yet at this stage,
    // so the caller (the server below) doesn't need to do anything further.
    console.error('Connection error (client likely disconnected):', err.message);
  });
}

// acceptingConnections enforces "one connection at a time" from DECISIONS.md #4.
// Node's net module is event-driven and would happily interleave two clients'
// output if we let it -- this flag is how we deliberately keep the demo's
// printed output in a predictable, non-interleaved order.
let acceptingConnections = true;

const server = net.createServer((socket) => {
  if (!acceptingConnections) {
    // Reject politely rather than silently dropping the byte stream --
    // the caller (curl) will see a clean connection-refused rather than a hang
    socket.end();
    return;
  }

  acceptingConnections = false; // block new connections until this one finishes
  handleConnection(socket);
  socket.on('close', () => {
    acceptingConnections = true; // reopen the gate once this client is done
  });
});

server.listen(PORT, () => {
  // This line is your visible proof the concept works: if you see it,
  // the raw listener is up and ready for curl to talk to.
  console.log(`Raw TCP listener up on http://localhost:${PORT}`);
  console.log('Send it a GET and a POST with curl and watch the raw bytes appear.\n');
});
