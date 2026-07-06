# Module 01 — Decisions: HTTP Request Anatomy

## 1. Raw TCP socket before any HTTP framework
**Decision:** Module 01 opens a raw TCP listener (Node's `net` module / PHP's
`stream_socket_server`) instead of starting with Express, PHP's built-in
server, or any HTTP library.
**Why:** Every framework you'll use from Module 02 onward does the same job
under the hood: read bytes off a socket, parse them into a method, headers,
and body. If we start with the framework, that parsing happens invisibly
and you'll spend the rest of this course trusting a black box. Seeing the
literal bytes first means every abstraction after this module is something
you can mentally "unfold" back to wire format — which matters directly for
XSS, because encoding bugs are bugs in how bytes get turned into HTML, and
you can't reason precisely about encoding if you've never seen the raw
material it operates on.
**Trade-off:** A raw socket server has no HTTP compliance at all — no
chunked transfer-encoding, no keep-alive, no header folding, no
percent-decoding. A production server (nginx, Node's `http` module, Apache,
PHP-FPM) implements the full RFC 7230 grammar. The fix, if you needed a real
compliant HTTP server, is to use the platform's `http` module rather than
raw `net` — but you'd never see the raw bytes that way, which defeats this
module's purpose.

## 2. Print bytes unparsed — do not split into method/headers/body yet
**Decision:** Module 01's server prints exactly what it received as one
undifferentiated block of text, with no attempt to locate the request line
or split headers from body.
**Why:** Splitting a raw HTTP message into method/path/headers/body is
precisely the job of Module 02 (Superglobals & req Objects) — that's the
very next concept and it deserves its own module rather than being
smuggled in here. If Module 01 already parsed the request, there would be
nothing left for Module 02 to teach.
**Trade-off:** This means Module 01's demo can't yet tell you "this was a
GET" or "this was a POST" programmatically — you confirm that by eye, by
reading the first line of the printed bytes. That's intentional at this
stage; a real parser (Module 02) extracts `req.method` / `$_SERVER['REQUEST_METHOD']`
for you instead of making you eyeball it.

## 3. Fixed-size read buffer, single read per connection
**Decision:** The socket handler reads one chunk (up to 8192 bytes) and
treats that as the whole request, rather than looping until a known
terminator.
**Why:** At Module 01's stage we have no concept yet of `Content-Length` or
the blank-line-terminates-headers rule — introducing either would require
explaining HTTP framing before we've even shown you a raw request. An 8 KB
single read is comfortably larger than any GET or POST this course's demos
will ever send.
**Trade-off:** A real HTTP server must loop reads until it has the full
message, because TCP makes no guarantee an entire request arrives in one
read — large POST bodies (file uploads, JSON payloads) routinely span
multiple reads. The production fix is to buffer incoming chunks and stop
only once you've located the header-terminating `\r\n\r\n` and then
consumed `Content-Length` more bytes of body — exactly what Node's `http`
module and PHP's SAPI do for you starting in Module 02.

## 4. Enforce one connection at a time
**Decision:** The Node demo explicitly rejects a second connection while
the first is still being handled, using a busy flag. The PHP demo achieves
the same result for free, because `stream_socket_accept()` blocks until a
connection is ready and the script never calls it again until the current
one is closed.
**Why:** Module 01 exists to show you *what a request looks like*, not to
teach concurrency. Handling one connection at a time guarantees the printed
output from two near-simultaneous curl calls is never interleaved, which
would be confusing before you've even learned what a single request
contains. It's also worth noticing that Node and PHP arrive at the same
behavior for structurally different reasons — Node's `net` module is
event-driven by default and needs an explicit flag to *stop* being
concurrent, while PHP's blocking `accept()` loop is sequential by default
and needs nothing extra.
**Trade-off:** A restaurant with one waiter who won't greet the next
customer until the current one has fully left the building falls over
immediately under real traffic. Production servers use an event loop
(Node's own `http` module) or a worker-process/thread pool (PHP-FPM,
Apache) to handle many connections concurrently. The fix is to remove the
busy flag (Node) or move to PHP-FPM (PHP) — both of which you get for free
the moment you stop using raw sockets, one more reason Module 02 hands the
parsing job to the platform's real HTTP layer.

## 5. Plain HTTP, no TLS
**Decision:** All traffic in this course runs over unencrypted
`http://localhost`, never `https://`.
**Why:** TLS termination is orthogonal to everything this course teaches —
GET/POST semantics, superglobals, and XSS all exist identically whether or
not the transport is encrypted. Adding a certificate step here would cost
setup time without teaching anything about request handling or output
encoding.
**Trade-off:** Never do this on a real network. Every module's payloads and
cookies in this course would be plaintext-sniffable on the wire in
production. The fix in a real deployment is TLS termination at the server
or a reverse proxy in front of it — it does not change anything else
you'll learn in this course.
