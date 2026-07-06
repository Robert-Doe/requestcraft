/*
 * test_runner.js
 *
 * Module 16: Testing Methodology & Payload Craft.
 *
 * Sends every payload in payload_catalog.js to a running target server
 * and classifies the response -- not by whether the ORIGINAL payload
 * string vanished, but by what actually remains in the response and
 * whether THAT is dangerous. This distinction is the entire lesson: a
 * payload can be "filtered" (changed) without being "sanitized" (made safe).
 *
 * Introduced in: Module 16.
 * Prerequisite concepts: every prior XSS module; Module 14's
 * allowlist/blocklist vocabulary specifically informs the classification logic.
 */

'use strict';

const http = require('http');
const { PAYLOAD_CATALOG } = require('./payload_catalog');

const TARGET = 'http://localhost:8000';

function fetchText(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

/*
 * extractReflection -- pulls just the reflected value out of the
 * target's known response template, so classification isn't confused
 * by the surrounding page markup.
 *
 * body: the full HTML response
 * returns: the text between "You searched for: " and "</p>"
 */
function extractReflection(body) {
  const match = /You searched for: ([\s\S]*?)<\/p>/.exec(body);
  return match ? match[1] : '';
}

/*
 * classify -- decides whether a reflected value is dangerous, safe, or
 * needs a human to look closer.
 *
 * original: the exact payload string that was sent
 * reflected: what the target actually put back in the response
 * returns: a verdict string
 *
 * This is the methodology this module teaches, made mechanical:
 *   1. Did the ORIGINAL survive completely unchanged?  -> raw reflection, dangerous
 *   2. Was it HTML-entity encoded (still all there, just escaped)? -> safe
 *   3. Was it changed in some other way? -> DO NOT assume safe --
 *      check whether what's LEFT still contains a real tag structure
 *   4. Did it vanish (reflected value is empty or unrelated)? -> rejected
 */
function classify(original, reflected) {
  if (reflected === original) {
    return 'RAW REFLECTION -- payload came back byte-for-byte unchanged. Almost certainly executes.';
  }

  const encodedVersion = original
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  if (reflected === encodedVersion) {
    return 'ENCODED -- payload was HTML-entity encoded. Safe against THIS sink.';
  }

  // Neither identical nor cleanly encoded -- something was stripped,
  // reordered, or partially modified. This is the case a lazy tester
  // skips: "it doesn't match what I sent, so it must be filtered."
  // Check whether what's LEFT still forms a real tag.
  if (/<[a-z]/i.test(reflected)) {
    return `MODIFIED, BUT STILL CONTAINS A RAW TAG -- "${reflected}" -- filtering happened, sanitization did not. Verify manually.`;
  }

  if (reflected.trim() === '') {
    return 'NOT REFLECTED -- payload produced no visible output. Could be rejected, or reflected somewhere this check does not look.';
  }

  return `MODIFIED, no raw tag detected -- "${reflected}" -- likely safe, but confirm by hand.`;
}

async function main() {
  console.log(`Sweeping ${PAYLOAD_CATALOG.length} payloads against ${TARGET}/search ...\n`);

  for (const { name, payload, note } of PAYLOAD_CATALOG) {
    const url = `${TARGET}/search?q=${encodeURIComponent(payload)}`;
    const body = await fetchText(url);
    const reflected = extractReflection(body);
    const verdict = classify(payload, reflected);

    console.log(`[${name}]`);
    console.log(`  sent:      ${payload}`);
    console.log(`  reflected: ${reflected}`);
    console.log(`  verdict:   ${verdict}`);
    console.log(`  (why this payload is in the catalog: ${note})`);
    console.log('');
  }
}

main().catch((err) => {
  console.error('Test runner failed:', err.message);
  console.error('Is the target running? (.\\run.ps1 -Target run-target-node)');
  process.exit(1);
});
