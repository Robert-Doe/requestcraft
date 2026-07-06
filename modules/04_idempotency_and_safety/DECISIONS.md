# Module 04 — Decisions: Idempotency & Safety

## 1. In-memory counter (Node) vs. file-persisted counter (PHP)
**Decision:** `node/server.js` stores its counters in plain JavaScript
variables; `php/router.php` persists them to a `counts.json` file on disk.
**Why:** This isn't a stylistic choice — it reflects a genuine difference
in how the two platforms run. Node's `http.createServer` keeps a single
process alive for the server's entire lifetime, so a variable declared
outside the request handler survives across requests naturally. PHP's
built-in development server (`php -S`) re-executes the whole script from
scratch for every incoming request — nothing declared in the script
survives to the next request unless it's saved somewhere external (a
file, a database, a session). Module 04 is exactly the right place to
surface this, because "does state survive between two GET requests" is
precisely what this module is about.
**Trade-off:** File-based persistence with no locking (see Decision #6) is
not how a real PHP application would store a counter — a production app
would use a database with atomic increment operations, or at minimum
`flock()` around the read-modify-write cycle. The fix, if this needed to
handle real concurrent traffic, is to move the counter into a database
transaction or an atomic operation like Redis's `INCR`.

## 2. Redirect (302) after increment instead of returning JSON
**Decision:** Both `/unsafe-increment` and `/safe-increment` respond with
an HTTP redirect back to `/`, not a JSON confirmation.
**Why:** This lets the exact same endpoint serve two different callers
identically: a real `<a href>` click (a full-page navigation, which
naturally follows a redirect) and the hidden `<img src>` tag (which
issues a plain GET and doesn't care what comes back). If the endpoint
returned JSON instead, clicking the visible link would dump raw JSON to
the screen instead of taking the student back to see the updated counter.
**Trade-off:** A redirect response doesn't give the hidden `<img>` tag
anything to render as an image, so it will show a small broken-image icon
in the browser. That's left as-is deliberately — it's honest visual proof
that the request happened and had a side effect, even though nothing
about the result "looks like" a successful image load.

## 3. The hidden `<img>` tag is the crawler simulation, embedded directly in the page
**Decision:** Rather than only describing "a crawler might do this,"
Module 04's own page embeds `<img src="/unsafe-increment" style="display:none">` —
a real, currently-common technique (this is exactly how email open-tracking
pixels work) that fires a GET request the instant the page loads, with no
click at all.
**Why:** This is not a contrived example — it's the same mechanism behind
real email tracking pixels, real link-preview bots (Slack, Discord,
iMessage all fetch URLs to generate previews), and real antivirus link
scanners. Seeing your own counter increment before you've clicked anything
is far more convincing than being told it's possible.
**Trade-off:** None — unlike most trade-offs in this course, this is not a
simplification of production reality; it IS production reality. This
exact bug (a GET-triggered state change, exploitable via an image tag) has
shipped in real applications — historically including account-deletion and
logout links built as plain GET-triggered `<a href>` targets.

## 4. crawler.js finds links via regex, and deliberately ignores `<form>`
**Decision:** `extractLinks()` scans only for `href="..."` and `src="..."`
attributes, using a simple regular expression — no HTML parser, and no
attempt to read `<form action="...">` targets.
**Why:** This is a faithful simulation of how real crawlers behave, not a
shortcut. Search engine crawlers, link previewers, and prefetchers follow
links and images because that's what those attributes are for — they do
not submit forms, because doing so would require guessing what data to
put in each field, and site owners don't expect random bots to submit
their forms. The fact that `crawler.js` structurally *cannot* discover or
trigger `/safe-increment` (a POST-only endpoint reachable only via a
`<form>`) is exactly the safety property Module 04 is teaching — and it
falls out naturally from writing an honest crawler, not from special-casing
the safe endpoint to be ignored.
**Trade-off:** A regex-based scanner will break on malformed or
deliberately adversarial HTML (mismatched quotes, attributes split across
lines). A production crawler uses a real HTML parser for exactly that
reason. That fragility doesn't undermine this module's point, since
`crawler.js` is a teaching tool, not a component of the system being taught.

## 5. `/safe-increment` returns 405 for GET, rather than silently ignoring it
**Decision:** Sending a GET to `/safe-increment` returns an explicit
`405 Method Not Allowed` with a message, instead of quietly doing nothing
or redirecting as if it worked.
**Why:** A silent no-op would hide the exact contrast this module exists
to draw. Returning 405 makes the safe endpoint's refusal visible in the
crawler's output and in curl, so you can directly compare "GET succeeded
and changed state" against "GET was explicitly rejected."
**Trade-off:** A very security-conscious production API might avoid
revealing *why* a route rejected a method (to reduce information leakage
to an attacker probing an API), returning a generic 404 instead. At
Module 04's stage, an informative error is far more valuable pedagogically
than that extra layer of obscurity would be.

## 6. No file locking around the PHP counter's read-modify-write
**Decision:** `read_counts()` and `write_counts()` in `php/router.php` do
not use `flock()` or any other locking mechanism.
**Why:** Introducing file locking here would add a whole new concept
(race conditions and mutual exclusion) to a module that's about a
completely different idea (GET's safety contract). The demo's crawler
script sends requests sequentially, one at a time, so no race ever
actually occurs during this module's exercises.
**Trade-off:** Two concurrent requests hitting `/unsafe-increment` at the
same instant could both read the same starting count, both add one, and
both write back the same final value — silently losing an increment. A
production fix would wrap the read-modify-write cycle in `flock()`, or
better, move the counter into something built for atomic increments (a
database, or an in-memory store like Redis with `INCR`).
