# Module 16 — Decisions: Testing Methodology & Payload Craft

## 1. The target's filter removes a WORD, not a TAG, in a single pass
**Decision:** `naiveFilter()` / the PHP equivalent applies
`replace(/script/gi, '')` exactly once across the whole input string.
**Why:** This specific mistake — string-level word removal instead of
proper parsing, applied non-recursively — is what makes the
`nested-script-bypass` catalog entry work at all. It's also a completely
realistic mistake: many real, historical WAF and filter bypasses have
exploited exactly this non-recursive-removal pattern, on filters that
otherwise looked reasonable at a glance.
**Trade-off:** None — this is the deliberate, realistic "before" state
this module's test runner is built to catch.

## 2. Classification compares against BOTH raw and fully-encoded versions before giving up
**Decision:** `classify()` checks, in order: (1) is the reflection
byte-for-byte identical to the input, (2) is it byte-for-byte identical
to the FULLY HTML-encoded version of the input, (3) does whatever
remains still contain a raw tag-opening pattern, (4) did it vanish entirely.
**Why:** This ordering mirrors real methodology. Checking for exact
identity first (unencoded) catches the obvious case. Checking against
the FULLY encoded form next means a properly-fixed endpoint (Module 11's
style) gets correctly recognized as safe, not just flagged as "changed."
Only after both of those fail does the runner fall into the crucial
"something in between happened" case — which is exactly where lazy
testing stops looking and this module insists on looking closer.
**Trade-off:** None — this is the accurate, real order of investigation
a careful tester follows.

## 3. "Still contains a raw tag" is a heuristic flag, not a final verdict
**Decision:** The `MODIFIED, BUT STILL CONTAINS A RAW TAG` verdict is
phrased as "verify manually," not "confirmed dangerous."
**Why:** This course's own verified test run surfaced a real example of
why: the `javascript-href` payload's `javascript:` scheme also had
"script" stripped out of it, becoming `java:` — which is actually
harmless as a URL scheme, even though the surrounding `<a href="...">`
tag structure survived intact and triggered this exact heuristic. A tool
that confidently declared this "DANGEROUS" would have been wrong. A tool
that confidently declared it "SAFE" without a human looking would also
be one lucky coincidence away from missing a real bug on a different
input. The correct, honest verdict a mechanical checker can give here is
"this needs a human to look" — which is what real triage of automated
scanner output looks like in practice.
**Trade-off:** This means the test runner cannot fully automate a
pass/fail verdict for every payload — some results genuinely require
human judgment. That's not a limitation to engineer away; it's an
accurate reflection of what black-box testing tools can and cannot determine alone.

## 4. The plain-text control case is included deliberately
**Decision:** The first catalog entry is `hello world` — no markup at all.
**Why:** A payload catalog without a benign control case can't tell you
whether an unexpected verdict means "the filter did something
interesting" or "the test runner itself is broken." If the control case
ever comes back modified, the bug is in your test harness, not the
target — checking this first is standard testing hygiene applied to
security tooling specifically.
**Trade-off:** None — this is simply good practice, at negligible cost.

## 5. Eight payloads, chosen for category coverage, not exhaustiveness
**Decision:** The catalog has eight entries, each demonstrating a
distinct category (control, classic tag, case variation, nested bypass,
non-script tag, different non-script tag, structural-tag handler, URL
scheme) rather than dozens of minor variations on one theme.
**Why:** A real payload catalog used by a working security tester often
has hundreds of entries — but the VALUE of this module is teaching you
to recognize the categories worth testing for, not handing you an
exhaustive list to memorize. Once you understand why
`nested-script-bypass` and `img-onerror` are testing fundamentally
different things than `classic-script-tag`, you can generate new variations
within each category yourself, which is a more durable skill than a longer static list.
**Trade-off:** This catalog will miss vulnerabilities outside these eight
categories (there are many more real bypass techniques: encoding tricks,
polyglot payloads, mutation-XSS via browser HTML parsing quirks). Module
17's capstone is where you're expected to extend this catalog yourself
against a larger, more realistic target.
