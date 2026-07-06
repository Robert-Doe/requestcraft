# Module 08 — Decisions: DOM-Based XSS

## 1. The payload lives in `location.hash`, specifically because it's never sent to the server
**Decision:** This module's source is the URL fragment (`location.hash`),
not a query string, cookie, or any other server-visible value.
**Why:** Per RFC 3986, the fragment identifier (everything after `#`) is
part of a URL that the browser resolves entirely on its own — it is
explicitly excluded from the HTTP request line and headers when the
browser fetches a page. That's not a quirk of this demo; it's the actual
URL specification. Choosing `location.hash` as the source is what makes
this module genuinely "no server round-trip," rather than merely
"an example that happens to run in JavaScript."
**Trade-off:** None — this is the correct, deliberate choice for teaching
this specific concept. Other DOM sources exist (`document.referrer`,
`window.name`, `postMessage` data) that ARE sometimes visible to a server
in other circumstances; `location.hash` is chosen because it's the
cleanest possible demonstration of a source the server structurally
cannot see, ever, under any configuration.

## 2. `.innerHTML` is the sink again, deliberately reusing Module 06's vocabulary
**Decision:** The vulnerable line is `document.getElementById('greeting').innerHTML = 'Hello, ' + decoded + '!'`.
**Why:** Module 06 already taught you that `.innerHTML` is a sink and
`.textContent` is not. Reusing the identical sink here, rather than
introducing a new one, keeps this module's only new variable isolated to
the SOURCE side of the equation (a source that never touches the server)
rather than teaching a new sink at the same time.
**Trade-off:** None — this is a deliberate narrowing of scope, consistent
with this course's "exactly one new concept per module" rule.

## 3. `hashchange` listener + an immediate call, mirroring real SPA routers
**Decision:** `updateGreeting()` runs once immediately on page load AND
is re-registered as a `hashchange` event listener.
**Why:** This exact pattern — read `location.hash`, react to it, and
re-run the same logic every time the hash changes without a full page
reload — is how a huge number of real single-page application routers
work (client-side routing without a server round-trip is the entire
selling point of an SPA). Showing both triggers (initial load and
in-page hash change) demonstrates that this bug fires not just when a
malicious link is first opened, but every time the hash changes
afterward, including via client-side navigation the victim thinks is
"just clicking around the app."
**Trade-off:** None specific to production concerns — this is accurately
representing common real-world code, not simplifying it.

## 4. `decodeURIComponent()` is called on the value, and it does NOT fix anything
**Decision:** `updateGreeting()` calls `decodeURIComponent(name)` before
using the value, exactly like real code that wants a "readable" name
instead of percent-encoded text.
**Why:** This is included specifically because it's a common point of
confusion: `decodeURIComponent` reverses percent-encoding (turning
`%3C` back into `<`), which is completely unrelated to HTML-escaping
(turning `<` into `&lt;`). Real developers sometimes see a decoding call
in code and mistake it for a safety measure. Module 08 places this call
directly in the vulnerable path specifically to demonstrate that it does
nothing to prevent the attack — the payload executes exactly as
successfully with or without it.
**Trade-off:** None — again, deliberately instructive rather than a
simplification of anything.

## 5. Zero server-side logic for the vulnerable behavior — the server is a dumb file host
**Decision:** Both `node/server.js` and `php/router.php` do nothing more
than serve one static HTML page. Neither contains a single line related
to the actual vulnerability.
**Why:** This is the entire lesson of Module 08 made structural rather
than just stated: some of the most dangerous XSS bugs in modern
JavaScript-heavy applications never touch server code review at all,
because the server genuinely has no role in the vulnerable data flow. A
security review that only reads server-side code would find nothing
wrong here — the bug is 100% in a `.js` file (or an inline `<script>`
block) that a backend-focused reviewer might not even think to check.
**Trade-off:** None — this file-split (server does nothing, client does
everything) is the accurate reflection of how real DOM-based XSS bugs are
structured, not a simplification for teaching purposes.
