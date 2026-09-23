# requestcraft

I wanted to take GET and POST apart down to the socket, and then use that to teach XSS and CSRF the way they actually happen, not as vocabulary you memorize. requestcraft is a 17-module course that starts from raw bytes on a TCP connection and builds up, one deliberate layer at a time, to a fully hardened web application. The whole thing runs on a single restaurant analogy: GET is reading the menu or asking the host a question, nothing in the kitchen changes. POST is handing in an order ticket that changes what the kitchen actually does. Every vulnerability class that shows up later in the course is a variation on someone abusing that distinction, a forged order ticket for CSRF, a note scrawled on a slip that the waiter reads aloud to every other diner for XSS, and every defense is the restaurant closing that specific loophole.

## Why this exists

Most security courses teach XSS and CSRF as isolated vocabulary. Escape your output. Use a CSRF token. I wanted to teach them as the inevitable consequence of how GET and POST actually work, once you've seen the raw request bytes, the server-side superglobals that parse them, and the sinks that render them back out. By the time Module 5 introduces the first exploit, you already have working code, in both PHP 8 and Node.js, that shows exactly which line of request-handling code the exploit is abusing. So the fix in Modules 11 through 15 is never "add a magic function," it's "here is the specific gap in the code you already read."

## Repository layout

This repository is the extracted, standalone course content, originally developed under a working title of `xss_mastery` inside a broader personal workspace. The `ROADMAP.md` at the root still uses that internal name in places, the course itself is `requestcraft`. Each module lives under `modules/NN_name/` and stands on its own: a `tutorial.html` walkthrough, a `DECISIONS.md` explaining implementation choices, parallel `php/` and `node/` implementations, and a `run.ps1` launcher (PowerShell, with `run-node`, `run-php`, and `clean` targets, since this course was built and verified on Windows).

## Module map

| # | Module | What it demonstrates |
|---|--------|-----------------------|
| 01 | [HTTP Request Anatomy](modules/01_http_request_anatomy/) | Raw TCP bytes off the wire, before any framework parses them |
| 02 | [Superglobals & req Objects](modules/02_superglobals_and_req_objects/) | `$_GET`/`$_POST` vs. `req.query`/`req.body` as parsed views of Module 1's bytes |
| 03 | [Forms & Method Semantics](modules/03_forms_and_method_semantics/) | `method=get` vs. `method=post`, observed in the URL bar, browser history, and server logs |
| 04 | [Idempotency & Safety](modules/04_idempotency_and_safety/) | A counter endpoint proves why GET must never mutate state |
| 05 | [Reflected XSS via GET](modules/05_reflected_xss_via_get/) | A vulnerable search box, exploited with a single crafted URL |
| 06 | [Sources & Sinks](modules/06_sources_and_sinks/) | Mapping every place untrusted data enters and every dangerous place it can land |
| 07 | [Stored XSS via POST](modules/07_stored_xss_via_post/) | A vulnerable guestbook where one POSTed comment attacks every future visitor |
| 08 | [DOM-Based XSS](modules/08_dom_based_xss/) | A client-side-only vulnerability via `location.hash`, zero server round trip |
| 09 | [CSRF via GET](modules/09_csrf_via_get/) | A third-party page's `<img>` tag silently triggers a state change |
| 10 | [CSRF via POST](modules/10_csrf_via_post/) | An auto-submitting form forges a POST, then gets fixed with CSRF tokens and `SameSite` |
| 11 | [Output Encoding Defenses](modules/11_output_encoding_defenses/) | Context-aware encoding patches the Module 5 and Module 7 exploits |
| 12 | [Content Security Policy](modules/12_content_security_policy/) | A CSP header stops payloads even when encoding gets missed |
| 13 | [Cookie & Session Hardening](modules/13_cookie_and_session_hardening/) | `HttpOnly`/`Secure`/`SameSite`, steal a session, then protect it |
| 14 | [Input Validation as Defense-in-Depth](modules/14_input_validation_as_defense_in_depth/) | Allowlisting layered on top of, never instead of, output encoding |
| 15 | [File Upload Abuse](modules/15_file_upload_abuse/) | `$_FILES`/`multer` MIME- and extension-spoofing through multipart POST |
| 16 | [Testing Methodology & Payload Craft](modules/16_testing_methodology_and_payload_craft/) | Hand-crafting requests with curl, building a reusable payload catalog |
| 17 | [Capstone: Vulnerable-to-Hardened Guestbook](modules/17_capstone/) | Exploit the guestbook end to end, patch every hole, write it up like a pentest report |

## Tech stack

PHP 8 is the primary research language, using native superglobals with no framework layer hiding the mechanics. Node.js provides an equivalent implementation of every module so the demos run even where PHP isn't on `PATH`. PowerShell (`run.ps1` per module) is the Make-equivalent launcher, with `run-node`, `run-php`, and `clean` targets. Plain HTML, CSS, and JS make up the vulnerable-then-hardened front ends used in the XSS and CSRF demos.

## Where this stands

All 17 modules complete. Every server-side demo was verified live, curl and/or a headless browser, during construction. See each module's `tutorial.html` "Verified" callouts for the specific evidence, and each module's `DECISIONS.md` for why its lab code is built the way it is.

## How to run

Each module is self-contained and driven by its own `run.ps1`:

```powershell
cd modules\01_http_request_anatomy
.\run.ps1 run-php    # or run-node
.\run.ps1 clean
```

Read `ROADMAP.md` for the full course design (student level, analogy universe, per-module descriptions), then work through `modules/` in order. Each module's `tutorial.html` assumes the previous ones are done, and the exploits from Modules 5 through 10 are the exact vulnerabilities that Modules 11 through 15 patch.
