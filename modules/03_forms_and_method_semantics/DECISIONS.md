# Module 03 — Decisions: Forms & Method Semantics

## 1. Serve real, submittable HTML forms instead of describing them
**Decision:** This module's demo is a live page with two working
`<form>` elements, not a diagram or a written description of what forms do.
**Why:** The entire point of Module 03 is something you have to *see happen
in your own browser* — the address bar changing for GET and not changing
for POST. A screenshot or a written claim ("GET puts data in the URL")
is far weaker evidence than watching it happen when you click your own
submit button on your own machine.
**Trade-off:** None specific to production concerns here — this is simply
the correct teaching tool for this specific concept, not a simplification
we'll need to walk back later.

## 2. Plain form submission — no JavaScript, no fetch()
**Decision:** Both forms submit via a normal full-page browser navigation.
No `fetch()`, no `XMLHttpRequest`, no `preventDefault()`.
**Why:** A JavaScript-driven submission (via `fetch`) can be made to look
like anything — you could fake the address-bar behavior, intentionally or
by accident, in a way that no longer reflects what an ordinary HTML form
actually does. A plain, un-intercepted form submission is the browser's
actual, unmodified GET/POST behavior, and that authenticity is the whole
value of this module's demo.
**Trade-off:** This means every form submission is a full page reload,
which feels old-fashioned compared to the AJAX-driven apps you're probably
used to building. That's fine at this stage — this course reaches DOM-based
JavaScript concerns directly in Module 08, once you've first seen the
"plain" version of every behavior with nothing hidden by client-side script.

## 3. Simulate an access log line instead of writing to a real log file
**Decision:** Every request prints a `[ACCESS LOG] METHOD /path?query` line
to the console, formatted to match what Apache's or nginx's default access
log actually records — but nothing is written to disk.
**Why:** The behavior being taught (query strings get logged, POST bodies
don't) is real and matches production servers exactly; writing to an actual
log file on disk would add file-handling mechanics that have nothing to do
with the concept and would need their own cleanup step in `run.ps1 -Target clean`.
**Trade-off:** A real production access log is written by the web server
or reverse proxy itself (Apache, nginx, a load balancer), not by
application code — so in a real deployment you don't control the log
format the way this demo does. The concept transfers directly regardless:
whatever writes your production access log, it's reading the same request
line this demo is reading, and it has the same blind spot for POST bodies.

## 4. Reuse Module 02's parsing functions verbatim, unchanged
**Decision:** `parseFormEncoded()` and `readBody()` in this module's
`node/server.js` are byte-for-byte the same as Module 02's — copied
forward rather than imported from a shared file.
**Why:** Per this course's cumulative rule, every module's directory must
be runnable on its own without reaching into another module's folder. At
Module 03's stage, "parsing a form-encoded string" is a solved problem,
not a new concept — the new concept is what a `<form>` element does with
that parsed data, so the parsing code appears here unchanged rather than
being rewritten or re-explained.
**Trade-off:** This produces real code duplication across module folders,
which a production codebase would never tolerate — you'd put this in a
shared module and import it everywhere. That trade-off is deliberate here:
a real course repo optimizes for "any single module folder is a complete,
standalone lesson," which is a different goal than a production codebase's
"no duplicated logic."

## 5. POST's response is a full HTML page, not JSON
**Decision:** Unlike Module 02's raw JSON dump, `/comment` in this module
returns a complete HTML page confirming what was posted.
**Why:** Module 03's concept only shows up in a real browser's address bar
and page — a JSON response has no address bar behavior to observe, since
you'd typically only see raw JSON via curl. Returning HTML is what lets you
actually watch the URL stay put after a POST, in the same window where you
just submitted the form.
**Trade-off:** None yet — this is simply matching the response format to
what the module needs to demonstrate. Once you reach Module 07 (Stored XSS
via POST), this exact pattern — taking a POSTed value and echoing it back
into an HTML page — is precisely the shape of code that becomes dangerous
the moment the echoed value isn't encoded.
