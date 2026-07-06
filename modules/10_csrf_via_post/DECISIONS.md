# Module 10 — Decisions: CSRF via POST

## 1. `bank-vulnerable` sets its cookie with no `SameSite` attribute at all
**Decision:** `node/bank-vulnerable/server.js` sets
`Set-Cookie: session=victim; Path=/` — no `SameSite` value specified.
**Why:** This needs to be the clean "before" state for this module's
comparison. Adding any defense here — even accidentally, by copying
`bank-fixed`'s cookie header — would blur the A/B comparison this module
depends on: identical attacker page, two different bank configurations,
two different outcomes.
**Trade-off:** Modern browsers apply a default `SameSite=Lax` treatment to
cookies with no explicit attribute, which provides SOME protection on
its own in many real deployments. This course verified empirically (see
Module 09 and this module's own testing notes) that relying on that
default is inconsistent across browser versions, automation contexts, and
even short "grace periods" some browsers apply to newly-set cookies. The
actionable lesson is Decision #2's real point: never rely on a default
you haven't verified — set `SameSite` explicitly.

## 2. POST-only is shown failing BEFORE the real fix is introduced
**Decision:** `bank-vulnerable` requires POST (unlike Module 09's bank,
which allowed GET) but is still successfully attacked by
`node/attacker/server.js`'s auto-submitting form.
**Why:** "Just require POST" is the single most common incomplete fix
attempt for CSRF, and it needs to be shown failing, concretely, before
introducing token-based defense — otherwise a student could reasonably
assume Module 09's lesson was "GET bad, POST good" rather than the actual
lesson: any request authenticated ONLY by an automatically-attached
cookie is forgeable, regardless of method. An `<img>` tag can't forge a
POST, but a hidden, auto-submitting `<form>` can, with about the same
amount of attacker effort.
**Trade-off:** None — this accurately reflects a real, extremely common
production mistake.

## 3. Two independent defenses, layered, not one defense chosen over the other
**Decision:** `bank-fixed` implements BOTH a per-session CSRF token AND
`SameSite=Strict` on the cookie — not one or the other.
**Why:** These defenses work at different layers and fail differently.
The CSRF token is an application-level check: even if a cookie somehow
reached the server on a forged request (a misconfigured proxy, a browser
bug, a future `SameSite` policy change), the token check independently
stops the transfer, because the token is never exposed to the attacker's
page. `SameSite=Strict` is a browser-level check: even if the token check
had a bug (a timing attack, a logic error), the browser refuses to attach
the cookie to the forged cross-site request in the first place, meaning
the server never even sees an authenticated session to attack. This
mirrors a general security principle — defense in depth — where two
independent, differently-failing controls are more robust than either
alone.
**Trade-off:** Two mechanisms are more code than one, and a system with
only one of these defenses is meaningfully safer than a system with
neither — you don't need both to have a real improvement over Module 09's
bank. But relying on exactly one, alone, means a single bug or a single
browser inconsistency (see Decision #1) removes 100% of your protection.

## 4. The CSRF token is stored server-side, not just embedded and trusted
**Decision:** `csrfTokens[session]` (Node) / `tokens.json` keyed by
session (PHP) hold the expected value; the form field is compared
against that stored value, not merely checked for "is this field present."
**Why:** A common, subtly broken CSRF-token implementation just checks
"does a `csrf_token` field exist" without verifying its value against
anything — which an attacker's forged form can trivially satisfy by
including ANY value in a field with that name. The actual security
property requires the token to be something the attacker's page has no
way to learn, which requires the server to independently remember what
value it issued and compare against that specific value.
**Trade-off:** This requires server-side storage of one token per active
session (in memory for Node, in a file for PHP, matching this course's
established persistence pattern). A production system typically stores
this in the same session store already being used for login state — not
a new persistence mechanism.

## 5. Token comparison uses `!==` / `!=`, not a timing-safe comparison
**Decision:** Both bank-fixed implementations compare the submitted token
to the stored token with a plain equality check.
**Why:** Introducing timing-safe comparison (`crypto.timingSafeEqual` in
Node, `hash_equals()` in PHP) would add a related but distinct concept —
defending against timing side-channel attacks that could let an attacker
guess a secret one byte at a time by measuring response time differences.
That's a real, valid concern for comparing secrets, but it's a layer of
depth beyond this module's core lesson (that a comparison needs to happen
at all).
**Trade-off:** A plain `!==`/`!=` comparison in most language runtimes
exits as soon as it finds a mismatched byte, which — under a very
sophisticated, high-precision timing attack over a network — could
theoretically leak information about how many leading bytes matched. A
production implementation handling truly high-value secrets should use
`crypto.timingSafeEqual()` (Node) or `hash_equals()` (PHP), both of which
compare in constant time regardless of where the mismatch occurs.
