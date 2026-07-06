# Module 05 — Decisions: Reflected XSS via GET

## 1. Plain string interpolation, no templating engine at all
**Decision:** `vulnerableSearchPage()` builds HTML with a raw JavaScript
template literal (`${q}`); the PHP version uses plain string
concatenation. Neither uses a templating engine of any kind.
**Why:** Most real-world templating engines (Blade, Twig, even plain
JSX) auto-escape interpolated values by default, which would silently
fix this module's bug before you ever saw it break. Module 05 needs you
to see the vulnerability happen with your own eyes, which means using the
one construct that has zero built-in protection: direct string building.
**Trade-off:** No real production app should build HTML by hand like
this — not because it's insecure by definition, but because it's exactly
this easy to forget the one encoding call that keeps it safe. Module 11
introduces the fix (explicit, deliberate encoding) without switching to a
different templating system, specifically so you see that the fix is a
discipline, not a framework feature you can rely on blindly either.

## 2. Reflected, not stored — the payload never touches a database
**Decision:** The vulnerable value comes straight from `$_GET['q']` /
`getParams.q` on every request and is never saved anywhere.
**Why:** This isolates the GET-specific half of XSS from the POST/storage
half, which Module 07 covers separately. Reflected XSS is the form most
tightly coupled to GET requests specifically, because the entire attack
payload can live in a URL that's shared as a link — no database, no
persistence layer, no second visitor required.
**Trade-off:** None — this is a deliberate scoping decision, not a
simplification that costs realism. Reflected XSS via a GET-based search
box is one of the most common real-world XSS findings precisely because
it requires nothing more than what this module builds.

## 3. The demo payload changes `document.title`, not `alert()`
**Decision:** This module's own verification uses a payload like
`<script>document.title='XSS-PROOF'</script>` rather than the classic
`<script>alert(document.cookie)</script>` you'll see in most XSS writeups.
**Why:** `alert()` opens a blocking browser dialog box that halts
JavaScript execution until a human clicks OK — which makes it a poor
choice for a script you're running against your own browser during
self-paced learning, since it can appear to "hang." Changing
`document.title` is just as real a proof of code execution (open your
browser's tab title bar and you'll see it) without blocking anything.
**Trade-off:** `alert(document.cookie)` is worth knowing as the
*canonical* PoC you'll see in the wild and in bug bounty reports, because
it simultaneously proves script execution AND demonstrates the actual
payoff (reading a cookie an attacker shouldn't have access to). The
tutorial shows you that version too, as the "real-world" example — you're
encouraged to try it yourself and click through the dialog.

## 4. No encoding function exists anywhere in this module's code
**Decision:** There is no `escapeHtml()`, no `htmlspecialchars()` call,
not even commented out, anywhere in `node/server.js` or `php/router.php`.
**Why:** Introducing an encoding function here — even one deliberately
left unused — would tip you off that "the fix is right here, just call
it," turning this module into a fill-in-the-blank exercise instead of a
genuine "watch a real attack work" exercise. Module 11 introduces the
concept of context-aware encoding on its own terms, once you've fully
internalized what happens without it.
**Trade-off:** None specific to production code — this is purely a
sequencing decision for how the course teaches the material.

## 5. One vulnerable sink only, kept deliberately narrow
**Decision:** The entire vulnerable surface of this module is a single
line — the `<p>You searched for: ${q}</p>` interpolation. Nothing else in
the page touches `q`.
**Why:** Module 06 (Sources & Sinks) is where you learn to systematically
inventory every place untrusted data enters and every place it could land
dangerously. If Module 05 scattered `q` into five different spots (the
page title, an attribute, a script block), it would blur the one-clean-example
lesson this module needs before Module 06 broadens the picture on purpose.
**Trade-off:** A real page is rarely this simple — production XSS bugs
often hide in less obvious sinks (an HTML attribute, a URL used as an
`href`, a value dropped into an inline `<script>` block), each of which
needs a *different* encoding strategy. That complexity is exactly what
Module 06 exists to map out, deliberately one module later than this one.
