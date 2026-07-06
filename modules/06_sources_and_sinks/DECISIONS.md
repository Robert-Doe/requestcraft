# Module 06 — Decisions: Sources & Sinks

## 1. Build a tiny analyzer instead of only presenting a table of sources/sinks
**Decision:** Module 06's "demo" is a runnable program that classifies
code snippets, rather than a static reference table in the tutorial alone.
**Why:** This course's running theme (Module 02's hand-rolled parser,
Module 04's crawler) is that a concept becomes real once you've built the
mechanism yourself, not just read a description of it. A checklist of
"here are 4 sources and 5 sinks" is easy to read and easy to forget;
writing the pattern-matching logic that finds them in real code is what
makes the checklist stick.
**Trade-off:** None specific to production concerns — this genuinely is
the right teaching tool for this concept, matching the course's established pattern.

## 2. Same-line source+sink matching only — no data-flow tracking
**Decision:** `classify()` flags a line DANGEROUS only when a source
pattern and a sink pattern both match on that exact same line of text.
**Why:** Real taint tracking — following a value from where it enters the
program to every place it's eventually used, potentially across many
lines, functions, and even files — is what real static analysis tools
(like PHP's Psalm/Phan taint analysis, or JavaScript's ESLint security
plugins) actually do, and it requires building a real parser and a real
data-flow graph. That's a multi-week project on its own, not a single
teaching module. Restricting this tool to "same line" keeps the concept
demonstrable in under 150 lines of code while still teaching the
vocabulary (source, sink, escaping) correctly.
**Trade-off:** This tool would completely miss a vulnerability like:
```
$q = $_GET['q'];
// ... 40 lines later ...
echo "<p>$q</p>";
```
even though it's exactly as dangerous as the single-line version. A real
static analyzer tracks the variable `$q` across those 40 lines; this one
can't see past the line it's looking at. The fix, if you needed real
coverage, is exactly what tools like Psalm's taint analysis or Semgrep
provide — this module's tool is a teaching stand-in, not a replacement
for them.

## 3. Escaping is detected by function name, not by verifying it actually ran
**Decision:** `ESCAPE_MARKERS` just checks whether the text
`htmlspecialchars(`, `encodeURIComponent(`, or `escapeHtml(` appears
anywhere on the line — it doesn't verify the escaped value is the one
that actually reaches the sink.
**Why:** Actually verifying that data flow (which the same-line
limitation in Decision #2 already rules out doing properly) would require
real parsing of the expression tree, not pattern matching on text. For
this module's ten hand-picked samples, textual presence of the right
function name is accurate — see Decision #2 for the general limitation.
**Trade-off:** A line like
`echo "<p>" . htmlspecialchars($other_var) . $_GET['q'] . "</p>";` would
be misclassified as SAFE by this tool, because `htmlspecialchars(`
appears on the line — even though the actual dangerous value,
`$_GET['q']`, was never passed through it. This is a real, exploitable
blind spot in the tool, included deliberately so you understand why
"grep for the safe function name" is not a real security review
methodology, even though it's a tempting shortcut.

## 4. Ten fixed samples, not a scan of arbitrary user-supplied code
**Decision:** The program always analyzes the same ten hardcoded strings
— it doesn't accept a file path or arbitrary code as input.
**Why:** The goal is to see the classifier's reasoning applied to a
curated set of examples that between them cover: a real vulnerability
(sample 1, straight from Module 05), its fix (sample 2, previewing Module
11), a DOM sink (sample 3, previewing Module 08), a DOM non-sink (sample
4), a source with no sink at all (samples 5–6), a Referrer-based
real-world pattern (sample 7), `eval` (sample 8), a line with neither
(sample 9), and escaping applied before storage rather than at output
time (sample 10). A file-scanning tool would need real HTML/JS parsing to
be trustworthy against arbitrary input — see Decision #2.
**Trade-off:** This tool can't be pointed at your own project's code
today. If you wanted that, the realistic next step is reaching for an
existing taint-aware tool (Semgrep with security rulesets, or a
language-specific tool like Psalm for PHP) rather than extending this
one — extending this one to be safe against arbitrary code is the same
multi-week project named in Decision #2.

## 5. The `echo` sink pattern matches anywhere on the line, not just at the start
**Decision:** The PHP echo sink pattern is `/\becho\b/`, matching `echo`
as a whole word anywhere in the line — not `/^\s*echo\b/`, which would
only match when `echo` is the very first statement.
**Why:** Sample 10 (`$name = htmlspecialchars($_POST['name']); echo "<p>Hi, $name</p>";`)
puts a variable assignment before the `echo` on the same line. An
anchored pattern would miss the `echo` entirely and misclassify this line
as "source only," hiding the fact that it actually IS a source reaching a
sink — just a safe one, because the escaping happened during assignment
rather than inline at the echo. This was caught by actually running the
analyzer against the sample set and checking the output against the
expected verdict for each line, rather than trusting the regex by
inspection alone.
**Trade-off:** A word-boundary match is more permissive and could, in
principle, match `echo` appearing inside a string literal elsewhere on a
more complex line (e.g. `$x = "echo this back";`) and misidentify it as a
real `echo` statement. None of this module's ten samples trigger that
false positive, but it's a real, named gap consistent with Decision #2's
point: this tool reasons about text patterns, not real PHP syntax.

## 6. `.textContent` is deliberately absent from the SINKS list
**Decision:** `element.textContent = ...` does not match any pattern in
`SINKS`, so sample 4 is classified as "source only, no dangerous sink."
**Why:** This is not an omission — `.textContent` genuinely is not an
XSS sink. Assigning to `.textContent` tells the browser "treat this
entire string as plain text," so even a value containing
`<script>alert(1)</script>` is rendered as the literal, visible text
`<script>alert(1)</script>` rather than executed. Its absence from the
SINKS list is itself the lesson: recognizing which DOM properties parse
HTML (`.innerHTML`, `.outerHTML`) and which don't (`.textContent`,
`.innerText`) is exactly the kind of judgment call Module 08 (DOM-Based
XSS) will ask you to make while reading real code.
