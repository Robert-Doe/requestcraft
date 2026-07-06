# Module 09 — Decisions: CSRF via GET

## 1. Auto-assign the session cookie instead of building a real login form
**Decision:** Visiting the bank for the first time with no `session`
cookie silently assigns one (`session=victim`) rather than showing a
username/password form.
**Why:** Real authentication (password hashing, login forms, session
expiry) is an entire subject of its own, unrelated to this module's
concept — CSRF's defining feature is that it abuses an EXISTING,
already-authenticated session, not that it defeats login. Skipping
straight to "you're already logged in" keeps focus on the one new idea:
a cookie the browser attaches automatically is not proof of user intent.
**Trade-off:** A real banking app's login flow, session expiry, and
credential storage are all completely absent here. None of that
complexity changes this module's lesson — CSRF works identically against
a real, fully-implemented login system, because it targets what happens
AFTER login succeeds, not the login process itself.

## 2. Two servers on two different ports, simulating two different origins
**Decision:** The bank runs on port 8000; the "attacker site" runs on a
separate port, 8001 — both reachable at `localhost`, but treated as if
they were two unrelated domains.
**Why:** This is not a simplification of the real mechanism — it's an
accurate demonstration of it. Browsers scope cookies by domain (and
optionally path) but, critically, NOT by port by default. A cookie set by
`localhost:8000` is sent on a request to `localhost:8000` regardless of
whether the page that triggered that request was `localhost:8000` or
`localhost:8001` (or, in a real attack, some domain the attacker
registered that has nothing to do with the victim site at all). Using two
ports on the same machine is the simplest way to observe this real
browser behavior without needing two actual registered domains and DNS
setup.
**Trade-off:** None — this accurately reflects browser cookie-scoping
rules; it isn't a stand-in for something more complicated in production.
If anything, a real attacker's site (a domain with no relationship to the
bank at all) makes the attack MORE convincing to a human victim than two
`localhost` ports do, not less real as a technical matter.

## 3. The transfer amount and recipient are baked into the attacker's `<img>` tag
**Decision:** The malicious URL (`/transfer?to=attacker&amount=100`) is
fixed, hardcoded HTML on the attacker's page — not something the victim
enters or confirms in any way.
**Why:** This is the entire point of CSRF: the attacker decides the
parameters in advance, because the victim's browser — not the victim
personally — is the one making the request. There is no step where the
victim types "100" or "attacker" anywhere. That absence of victim input
is what distinguishes this from every previous module's demos, where a
human always typed something into a form first.
**Trade-off:** None — this is accurately showing the attack's actual shape.

## 4. No CSRF token, no Origin/Referer check — the vulnerability is total
**Decision:** `/transfer` performs zero checks beyond reading the session
cookie. It does not verify a CSRF token, does not check the `Origin` or
`Referer` header, and does not require any value the attacker couldn't
already guess or hardcode.
**Why:** Module 10 introduces the actual fix (CSRF tokens, combined with
moving this action to POST and adding `SameSite` cookies). Module 09
needs to show the undefended version completely broken first, so the
Module 10 fix has something concrete to repair.
**Trade-off:** None specific to production concerns — this file is
explicitly a "before" state, labeled as such, matching this course's
established Module 05/07 pattern of building the vulnerable version
first and fixing it in a later module.

## 5. Balances are shared in-memory (Node) or file-persisted (PHP), no per-user isolation
**Decision:** There's exactly one "victim" account and one "attacker"
account, globally, for any browser that connects — not per-visitor
sessions with independent balances.
**Why:** Modeling multiple independent users with separate sessions would
require real session management (unique session IDs, per-session
storage) — a mechanism unrelated to demonstrating CSRF itself. A single
shared victim account is sufficient to show the attack succeed.
**Trade-off:** If you run this demo, reload it, and run it again, the
balance keeps decreasing from wherever it was left — it does not reset
automatically. Use `.\run.ps1 -Target clean` to reset the PHP version's
persisted balance; restart the Node server to reset its in-memory version.
