# xss_mastery — Course Roadmap

**Subject:** GET/POST request handling and the XSS attacks/defenses built on top
of it, from raw HTTP bytes through PHP/Node request parsing to a fully
hardened web app.

**Student level:** intermediate developer (PHP background assumed; no prior
HTTP-internals or security background assumed).

**Languages:** every module ships PHP 8 code (your primary research
language) *and* an equivalent Node.js implementation (so every demo is
runnable right now on this machine, since PHP is not currently on PATH).

**Platform:** Windows 11, PowerShell. `run.ps1` in each module directory is
the Makefile-equivalent (`run-node`, `run-php`, `clean` targets).

**Analogy universe:** a restaurant (dining room + kitchen). GET = reading
the menu / asking the host a question — nothing in the kitchen changes.
POST = handing in an order ticket that changes what the kitchen does. The
query string is words shouted across the dining room everyone can hear;
the POST body is a sealed ticket passed to the kitchen. XSS is a customer
scrawling a fake "announcement" on their own order slip that the waiter
reads aloud verbatim over the restaurant PA system for every other diner
to hear. Stored XSS pins that note to the specials board for all future
customers. Reflected XSS is the waiter echoing it straight back to the
customer who wrote it. Output encoding is the front counter rewriting the
note in safe plain text before it's ever read aloud or posted.

## Modules

1. **HTTP Request Anatomy** — raw TCP bytes off the wire, before any framework parses them
2. **Superglobals & req Objects** — `$_GET`/`$_POST` vs `req.query`/`req.body` as parsed views of Module 1's bytes
3. **Forms & Method Semantics** — `method=get` vs `method=post`, observed in URL, history, and server logs
4. **Idempotency & Safety** — a counter endpoint shows why GET must never mutate state
5. **Reflected XSS via GET** — vulnerable search box, exploited with a crafted URL
6. **Sources & Sinks** — mapping every place untrusted data enters and every dangerous place it can land
7. **Stored XSS via POST** — vulnerable guestbook; one POSTed comment attacks every future visitor
8. **DOM-Based XSS** — client-side-only vuln via `location.hash`, zero server round-trip
9. **CSRF via GET** — an `<img>` tag on a third-party page silently triggers a state change
10. **CSRF via POST** — auto-submitting form forges a POST; fixed with CSRF tokens + `SameSite`
11. **Output Encoding Defenses** — context-aware encoding patches Modules 5 & 7
12. **Content Security Policy** — a CSP header breaks payloads even when encoding is missed
13. **Cookie & Session Hardening** — `HttpOnly`/`Secure`/`SameSite`, steal then protect a session
14. **Input Validation as Defense-in-Depth** — allowlisting layered on top of, never instead of, encoding
15. **File Upload Abuse** — `$_FILES`/`multer` MIME and extension spoofing via multipart POST
16. **Testing Methodology & Payload Craft** — hand-crafting requests with curl, building a payload catalog
17. **Capstone: Vulnerable-to-Hardened Guestbook** — exploit end-to-end, patch every hole, write it up

## Status

- [x] Module 01 — HTTP Request Anatomy
- [x] Module 02 — Superglobals & req Objects
- [x] Module 03 — Forms & Method Semantics
- [x] Module 04 — Idempotency & Safety
- [x] Module 05 — Reflected XSS via GET
- [x] Module 06 — Sources & Sinks
- [x] Module 07 — Stored XSS via POST
- [x] Module 08 — DOM-Based XSS
- [x] Module 09 — CSRF via GET
- [x] Module 10 — CSRF via POST
- [x] Module 11 — Output Encoding Defenses
- [x] Module 12 — Content Security Policy
- [x] Module 13 — Cookie & Session Hardening
- [x] Module 14 — Input Validation as Defense-in-Depth
- [x] Module 15 — File Upload Abuse
- [x] Module 16 — Testing Methodology & Payload Craft
- [x] Module 17 — Capstone: Vulnerable-to-Hardened Guestbook

All 17 modules complete. Every server-side demo verified live (curl and/or
headless browser) during construction — see each module's tutorial.html
"Verified" callouts for the specific evidence.
