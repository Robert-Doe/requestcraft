# Module 02 — Decisions: Superglobals & req Objects

## 1. Hand-roll the parser instead of using a library
**Decision:** `node/server.js` parses `x-www-form-urlencoded` text with a
hand-written `parseFormEncoded()` instead of Node's built-in `querystring`
module (and PHP's version isn't "hand-rolled" at all — the SAPI does it
before your script runs, which the tutorial makes visible on purpose).
**Why:** At Module 02's stage, the entire point is to demystify what
`$_GET`/`$_POST` and `req.query`/`req.body` actually are: a mechanical
split on `&` and `=`, plus percent-decoding. Reaching for a library to do
that splitting would replace one black box (the framework) with another
(the library) — you'd learn nothing about the mechanism itself.
**Trade-off:** `parseFormEncoded()` doesn't handle every edge case PHP's
SAPI or Node's `querystring` module do (nested bracket keys like `a[]=1`,
for instance). A production system should always use the platform's own
parser, precisely because it has been hardened against the edge cases and
malformed input a hand-written version like this hasn't been tested
against.

## 2. Keep GET and POST visibly separate — no $_REQUEST-style merge
**Decision:** The dump object always has distinct `GET` and `POST` keys,
never a single merged bag of parameters.
**Why:** PHP's `$_REQUEST` merges `$_GET`, `$_POST`, and `$_COOKIE` into
one array, and code that reads from `$_REQUEST` can no longer tell where a
value came from. At Module 02's stage, you are specifically learning to
distinguish the two channels — merging them here would erase the very
distinction this module exists to teach.
**Trade-off:** None at this stage — this is a case where the "simple"
approach and the "correct" approach are the same thing. It's worth noting
for later: `$_REQUEST` is not a simplification you should ever reach for in
real code, because a value's origin (URL vs. body vs. cookie) often
determines how much you should trust it — a theme that becomes concrete
starting in Module 09 (CSRF), where a value's *origin* is exactly what an
attacker is trying to forge.

## 3. Repeated keys overwrite rather than collect into an array
**Decision:** `?a=1&a=2` produces `{ a: '2' }`, not `{ a: ['1', '2'] }`.
**Why:** Handling repeated keys correctly requires deciding on an array
convention (PHP's `a[]=1&a[]=2` bracket syntax, or implicit last-value-wins,
or something else) — that's a real design question, but not the one
Module 02 is teaching. Introducing it here would bury the parsing concept
under an unrelated data-modeling decision.
**Trade-off:** This means `parseFormEncoded()` silently drops data a real
form could legitimately send (a multi-select `<select multiple>`, for
example, sends the same key multiple times). PHP's actual behavior when
you use `a[]` bracket syntax is to build a real array in `$_GET`/`$_POST` —
the fix, if you needed this, is to detect the `[]` suffix and push into an
array instead of overwriting.

## 4. PHP only auto-populates $_POST for known form content types
**Decision:** The tutorial calls out explicitly that `$_POST` is empty
unless `Content-Type` is `application/x-www-form-urlencoded` or
`multipart/form-data` — a raw JSON POST body leaves `$_POST` empty even
though data clearly arrived.
**Why:** This is a real, frequently-surprising PHP behavior, and Module
02's whole purpose is removing surprises about where request data lives.
Leaving it unexplained would set up a confusing moment days later when a
student POSTs JSON to a PHP endpoint and can't find their data anywhere.
**Trade-off:** Reading a JSON body in PHP requires reading `php://input`
directly and calling `json_decode()` yourself — PHP does not do it for
you. Module 02's demo doesn't implement that path, since form-encoded data
is enough to teach the parsing concept; a later, more advanced exercise
would need to add explicit `php://input` handling for JSON APIs.

## 5. Cap POST body size in the Node version
**Decision:** `readBody()` aborts the connection if the body exceeds 1 MB.
**Why:** At Module 02's stage there's no reason yet for a demo request to
be larger than a few dozen bytes of form data — a body of any real size is
either a mistake or a deliberate resource-exhaustion attempt, and there's
no value in buffering it just to prove that point.
**Trade-off:** 1 MB is an arbitrary number picked for a teaching demo, not
a production-sized limit — a real API might need a much larger or much
smaller cap depending on what it legitimately accepts, and PHP's own
`post_max_size` ini setting does this job for you automatically on the PHP
side, which is one more reason the two languages behave slightly
differently once a body gets unreasonably large.
