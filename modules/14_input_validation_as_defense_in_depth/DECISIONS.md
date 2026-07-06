# Module 14 — Decisions: Input Validation as Defense-in-Depth

## 1. `/blocklist` checks only for the literal substring `<script`
**Decision:** The naive validation route rejects a value only if it
contains `<script` (case-insensitive) — nothing else.
**Why:** This is deliberately the exact, specific mistake Module 07's
Brain Exercise warned about in the abstract. Making it a real, runnable
route lets you verify the bypass yourself instead of taking the earlier
warning on faith: `<img src=x onerror=alert(1)>` contains no `<script`
substring at all, sails through this check, and still executes once
reflected unescaped.
**Trade-off:** None — this route exists purely to be broken, matching
this course's established "before" pattern.

## 2. `/allowlist` combines exact-match validation WITH encoding, not validation alone
**Decision:** `safeOrder` is computed by strict equality against `'asc'`
and `'desc'`, and the result is STILL passed through `encodeHtml()` /
`enc()` before being written into HTML.
**Why:** For this specific field, the allowlist alone already makes
attacker-controlled markup impossible to reach the sink — if `order`
isn't exactly `"asc"` or `"desc"`, it's replaced with `"asc"` before
anything else happens. Encoding those two literal, known-safe strings is
redundant for THIS field. It's included anyway to model the correct
general habit: encode at the sink unconditionally, and let validation be
an additional, independent layer — never a reason to skip encoding
"because this value is already safe." Values believed to be "already
validated safe" are a common source of real bugs when a later code
change loosens the validation but the encoding call, having been deemed
unnecessary, was never added.
**Trade-off:** None — the redundancy costs nothing and removes a future
foot-gun.

## 3. `/freetext` deliberately has no allowlist at all
**Decision:** The `/freetext` route applies zero validation beyond
encoding — no length cap, no character restriction, nothing.
**Why:** A free-text message field has effectively unbounded legitimate
values ("hello," "5 < 10 is true," an email signature with special
characters) — there is no finite allowlist that could distinguish
legitimate messages from malicious ones by content. This route exists
specifically to prevent the module's main lesson from over-generalizing
into "always allowlist your input": allowlisting only works for
closed-set fields (status codes, sort orders, enum-like values, country
codes). For open-ended text, encoding at the sink is the only defense
that actually generalizes.
**Trade-off:** None — this is the necessary counter-example to keep the
module's lesson correctly scoped.

## 4. No length limit is enforced anywhere in this module
**Decision:** None of the three routes cap how long `order` or `msg` can be.
**Why:** Length limits are a legitimate, separate validation concern
(preventing resource exhaustion, enforcing reasonable UI constraints) —
unrelated to whether a value can execute as script once rendered. Adding
it here would dilute the module's one point: WHICH kind of validation
(allowlist vs. blocklist) actually stops XSS, for which KINDS of fields.
**Trade-off:** A production version of `/freetext` would almost
certainly cap message length for reasons entirely unrelated to security
(database column limits, UI layout, abuse prevention) — that's real, just
out of scope here.

## 5. Validation happens on the SAME string that will later be rendered, not a copy
**Decision:** `safeOrder` (the validated value) is the exact value passed
to `encodeHtml()` — there's no separate "raw" value used anywhere else
in the response.
**Why:** A subtle, real class of bug happens when code validates one
variable but accidentally renders a DIFFERENT variable that skipped
validation (a stale copy, a value read from a different part of the
request). Keeping validation and rendering operating on the identical
variable, with no parallel copies, removes an entire category of
"validated the wrong thing" mistakes.
**Trade-off:** None — this is simply careful data flow, not a simplification.
