/*
 * analyze.js
 *
 * Module 06: Sources & Sinks.
 *
 * A tiny, hand-rolled static analyzer. It scans a list of realistic code
 * snippets (some PHP, some JavaScript) and flags each one as DANGEROUS,
 * SAFE, or "nothing to flag," using nothing more than pattern matching
 * for known SOURCES (places untrusted data enters) and known SINKS
 * (places that can turn a string into executable HTML/JS if it isn't
 * encoded first). This is the exact mental checklist a human security
 * reviewer runs in their head while reading code -- this file just
 * makes it mechanical and repeatable.
 *
 * Introduced in: Module 06. No previous module's equivalent -- this is
 * the first analysis tool in the course, rather than a server.
 * Prerequisite concepts: Module 05 (Reflected XSS via GET) -- you need
 * to have seen one real source-to-sink flow before a checklist of many
 * sources and sinks means anything concrete to you.
 *
 * NOTE: This is a teaching tool, not a real static analyzer. See
 * DECISIONS.md for exactly where it's deliberately naive and why.
 */

'use strict';

/*
 * SOURCES -- places untrusted data can enter an application. Every one
 * of these represents data an attacker can control, directly or indirectly.
 */
const SOURCES = [
  { label: 'GET query string ($_GET / req.query)', pattern: /\$_GET|req\.query/ },
  { label: 'POST body ($_POST / req.body)', pattern: /\$_POST|req\.body/ },
  { label: 'URL fragment (location.hash)', pattern: /location\.hash/ },
  { label: 'Referrer header (document.referrer)', pattern: /document\.referrer/ },
];

/*
 * SINKS -- places that can turn a plain string into executable HTML or
 * JavaScript if the string reaching them wasn't properly encoded first.
 */
const SINKS = [
  { label: 'innerHTML assignment', pattern: /\.innerHTML\s*=/ },
  { label: 'document.write()', pattern: /document\.write\(/ },
  { label: 'eval()', pattern: /\beval\(/ },
  { label: 'insertAdjacentHTML()', pattern: /insertAdjacentHTML\(/ },
  { label: 'PHP echo/print of HTML', pattern: /\becho\b/ }, // \b not ^\s* -- must match even when echo isn't the first statement on the line (see DECISIONS.md #6)
];

// Markers that a value passed through an escaping/encoding function
// BEFORE reaching a sink -- their presence downgrades a DANGEROUS verdict
const ESCAPE_MARKERS = /htmlspecialchars\(|encodeURIComponent\(|escapeHtml\(/;

/*
 * SAMPLES -- realistic one-line snippets, deliberately picked so this
 * module's simple line-level heuristic classifies each one correctly.
 * See DECISIONS.md #2 for why real code needs more than a one-line
 * heuristic, and why that's fine for this module's purpose.
 */
const SAMPLES = [
  `echo "<p>You searched for: {$_GET['q']}</p>";`,
  `echo "<p>You searched for: " . htmlspecialchars($_GET['q']) . "</p>";`,
  `element.innerHTML = location.hash.substring(1);`,
  `element.textContent = location.hash.substring(1);`,
  `$stmt->bindParam(':q', $_GET['q']);`,
  `console.log(req.body.message);`,
  `document.write('<div>' + document.referrer + '</div>');`,
  `eval(location.hash.slice(1));`,
  `<img src="/logo.png">`,
  `$name = htmlspecialchars($_POST['name']); echo "<p>Hi, $name</p>";`,
];

/*
 * classify -- labels one code snippet as DANGEROUS, SAFE, or informational.
 *
 * line: a single line of code (string) to analyze
 * returns: { verdict, sourceHit, sinkHit, escaped } describing the analysis
 *
 * Assumes: source and sink both need to appear on the SAME line to be
 *          flagged DANGEROUS -- see DECISIONS.md #2 for why that's a
 *          real, named limitation of this tool, not an oversight.
 */
function classify(line) {
  const sourceHit = SOURCES.find((s) => s.pattern.test(line));
  const sinkHit = SINKS.find((s) => s.pattern.test(line));
  const escaped = ESCAPE_MARKERS.test(line);

  let verdict;
  if (sourceHit && sinkHit && escaped) {
    verdict = 'SAFE (source reaches a sink, but passes through an escaping call first)';
  } else if (sourceHit && sinkHit && !escaped) {
    verdict = 'DANGEROUS (untrusted source flows directly into a sink, unescaped)';
  } else if (sourceHit && !sinkHit) {
    verdict = 'source only -- no dangerous sink matched on this line (likely fine here)';
  } else if (!sourceHit && sinkHit) {
    verdict = 'sink only -- no untrusted source matched on this line (likely fine here)';
  } else {
    verdict = 'no source/sink pattern matched -- nothing to flag';
  }

  return { verdict, sourceHit, sinkHit, escaped };
}

console.log('=== Module 06: Sources & Sinks -- static analysis demo ===\n');

for (const line of SAMPLES) {
  const { verdict, sourceHit, sinkHit } = classify(line);
  console.log(`LINE:    ${line}`);
  if (sourceHit) console.log(`SOURCE:  ${sourceHit.label}`);
  if (sinkHit) console.log(`SINK:    ${sinkHit.label}`);
  console.log(`VERDICT: ${verdict}`);
  console.log('---');
}
