# Module 12 — Decisions: Content Security Policy

## 1. The vulnerable page is copied UNCHANGED from Module 05, bug and all
**Decision:** `vulnerablePage()` in this module is byte-for-byte the same
unescaped interpolation as Module 05's `vulnerableSearchPage()`. No
`encodeHtml()`, no fix, nothing from Module 11 applied.
**Why:** This module's entire lesson is that CSP is a defense that works
even when the encoding fix was never applied — a genuine second layer,
not a dependency on the first one. If this module quietly used the
Module 11 fixed version, you'd have no way to tell whether CSP or
encoding stopped the attack. Leaving the bug fully intact isolates CSP as
the only variable.
**Trade-off:** None specific to production code — but see Decision #5:
never treat this as license to skip Module 11's fix in anything you
actually ship.

## 2. Three CSP configurations, including a deliberately misconfigured one
**Decision:** `/no-csp`, `/csp-strict`, and `/csp-unsafe-inline` serve
the identical vulnerable markup with three different
`Content-Security-Policy` headers.
**Why:** Showing only "CSP fixes it" would teach an incomplete, dangerous
lesson: that ADDING a CSP header is sufficient, regardless of its
content. `'unsafe-inline'` is not a rare misconfiguration — it's a common
one, frequently added by developers frustrated that CSP is blocking
legitimate inline scripts they don't want to refactor, without realizing
that flag specifically re-opens the exact door CSP exists to close for
XSS. Demonstrating it FAIL to help, using the identical attack, is the
only way to make that risk concrete rather than a footnote.
**Trade-off:** None — this is deliberately showing a real, common failure
mode, not simplifying anything.

## 3. `script-src 'self'`, not a nonce-based or hash-based policy
**Decision:** The working policy in this module is
`default-src 'self'; script-src 'self'` — no `'nonce-...'` or
`'sha256-...'` source expressions.
**Why:** Nonces and hashes are the modern, recommended approach for
applications that need SOME inline scripts to run legitimately (a nonce
is regenerated per response and added both to the CSP header and to the
specific `<script nonce="...">` tags meant to be trusted) — but
explaining that mechanism requires explaining per-response nonce
generation and template integration, which is a real but separate topic
from this module's core lesson: that CSP can block ALL inline scripts
categorically, encoding bug or not.
**Trade-off:** A real production app almost never wants
`script-src 'self'` alone if it needs any inline scripts (analytics
snippets, small inline handlers) — those would break under this policy
exactly like the attacker's injected script does. The fix for legitimate
inline scripts is nonces or hashes, not `'unsafe-inline'`, which
re-introduces exactly the risk this module demonstrates.

## 4. CSP delivered via HTTP response header, not a `<meta>` tag
**Decision:** All three variants set `Content-Security-Policy` as an
actual HTTP header (`res.setHeader` / PHP's `header()`), not a
`<meta http-equiv="Content-Security-Policy">` tag in the HTML.
**Why:** A `<meta>`-tag CSP has real limitations the header form doesn't:
it cannot set `frame-ancestors`, cannot set `report-uri`/`report-to`, and
only takes effect once the parser reaches that `<meta>` tag — meaning
anything earlier in the document (including any injected script that
appears before it) is unprotected. The HTTP header applies to the entire
response from the first byte, which is the only version worth teaching
as "the real thing."
**Trade-off:** None — the header form has no real downside compared to
the `<meta>` form; it's simply the more complete and more universally
correct mechanism.

## 5. CSP is explicitly framed as a SECOND layer, not a replacement for Module 11
**Decision:** The tutorial for this module repeatedly emphasizes "in
addition to," never "instead of," Module 11's encoding fix.
**Why:** CSP has real, well-documented bypass techniques in specific
configurations (JSONP endpoints hosted on an allowed `'self'` origin,
certain older browser quirks, overly broad `script-src` allowlists
including CDNs that also host attacker-uploadable content). Treating CSP
as a substitute for fixing the actual injection point would leave real
production systems vulnerable to those documented bypasses. The correct
mental model, reinforced here, is defense in depth: encode your output
AND set a strict CSP — neither replaces the other.
**Trade-off:** None — this is a framing/emphasis decision, not a code trade-off.
