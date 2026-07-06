# Module 17 — Decisions: Capstone

## 1. Four independent bugs, combined in one app, not one mega-bug
**Decision:** The vulnerable Community Board has four SEPARATE flaws
(reflected XSS behind a naive filter, stored XSS, CSRF-able GET delete,
an exposed session cookie) rather than one elaborate, contrived
super-vulnerability.
**Why:** This is how real applications actually accumulate risk — not
through one dramatic flaw, but through several ordinary, independently
-introduced mistakes, each individually explainable (and each already
individually taught, in Modules 05, 07, 09/10, and 13), sitting side by
side because different parts of the app were written at different times,
possibly by different people, none of whom were thinking about how their
piece interacted with the others.
**Trade-off:** None — this is a deliberately realistic structure, not a
simplification.

## 2. The hardened version applies ONLY previously-taught fixes — no new techniques
**Decision:** Every fix in `hardened/server.js` — encoding, CSRF tokens,
HttpOnly/SameSite, CSP, allowlisting — is a direct, unmodified
application of a technique from Modules 11, 10, 13, 12, and 14
respectively.
**Why:** The capstone's purpose is proving you can RECOGNIZE and APPLY
what this course already taught, end to end, on a fresh piece of code —
not introducing a final, unexplained "advanced" technique at the last
minute. If Module 17 taught something genuinely new, it would
undermine its own premise as a capstone.
**Trade-off:** None — this is the entire point of a capstone module.

## 3. The naive filter is DELETED entirely in the fix, not layered under encoding
**Decision:** `hardened/server.js`'s `/search` route has no
`naiveFilter()`-equivalent at all — just `encodeHtml()`, unconditionally.
**Why:** Module 14 already established that a real fix (allowlist or,
here, universal encoding) doesn't need a blocklist alongside it —
keeping the broken filter "just in case, for defense in depth" would
suggest the blocklist was doing something useful. It wasn't. Real
encoding makes the blocklist's job structurally irrelevant: there is no
character sequence the naive filter was trying to catch that survives
`encodeHtml()` in dangerous form, so keeping it adds complexity and false
confidence with zero actual benefit.
**Trade-off:** None — removing genuinely dead, misleading code is
strictly an improvement, not a simplification of the lesson.

## 4. Post storage remains raw in BOTH versions; only rendering changes
**Decision:** `posts.push({..., message: p.message ...})` is identical,
byte for byte, in `vulnerable/server.js` and `hardened/server.js`. The
entire XSS fix lives in `renderPosts()`.
**Why:** This is Module 11's Decision #1, applied one more time,
deliberately, so the capstone doesn't quietly contradict something this
course spent an entire module establishing: encoding happens at the
sink, not at the point of storage.
**Trade-off:** None — consistent with everything already taught.

## 5. The CSRF fix includes all three parts from Module 10, not just one
**Decision:** The hardened `/delete` route (a) requires POST, (b)
rejects GET with 405 rather than silently ignoring it, and (c) validates
a CSRF token against a per-session stored value — all three, together.
**Why:** Module 10 demonstrated that "just require POST" alone is
insufficient (an auto-submitting form defeats it) — the capstone
deliberately implements the COMPLETE fix from that module, not a partial
version, to reinforce that the lesson was "these defenses work together,"
not "pick whichever one is easiest."
**Trade-off:** None — matches Module 10's own conclusion exactly.

## 6. The category field is a genuinely new allowlist example, not a repeat of Module 14's
**Decision:** The "category" dropdown (general/question/announcement) is
a new closed-set field, distinct from Module 14's "sort order" example.
**Why:** Reusing the exact same field name and values from Module 14
would make this feel like a copy-paste exercise rather than a
demonstration that you can spot a NEW closed-set field in a NEW context
and apply the same principle to it independently.
**Trade-off:** None — this is a deliberate, minor variation to test
transfer of the underlying skill, not just pattern-matching on a familiar example.
