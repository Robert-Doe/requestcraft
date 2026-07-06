/*
 * crawler.js
 *
 * Module 04: Idempotency & Safety.
 *
 * Simulates the simplest possible "crawler" -- a program that fetches
 * a page and then follows every link and image it finds, with zero
 * understanding of what those links DO. This is a deliberately naive
 * stand-in for real things that behave exactly this way: search-engine
 * crawlers, link-preview generators (Slack, Discord, iMessage), antivirus
 * URL scanners, and browsers' own predictive prefetch -- none of which
 * ask permission before fetching a URL, because GET is supposed to be
 * safe to fetch without asking.
 *
 * Run this against Module 04's server (either node/server.js or
 * php/router.php) while it's running, and watch the unsafe counter climb
 * even though nothing "clicked" anything.
 *
 * Introduced in: Module 04 -- the first standalone client tool in this
 * course, rather than a server.
 * Prerequisite concepts: Module 03 (Forms & Method Semantics).
 */

'use strict';

const http = require('http');

const TARGET = 'http://localhost:8000';

/*
 * fetchText -- GETs a URL and resolves with its response body as text.
 *
 * url: a full http:// URL to fetch
 * returns: a Promise resolving to the response body text
 *
 * Assumes: the target always responds -- there is no retry logic,
 *          because a real crawler failing on one page just moves on,
 *          which isn't worth simulating for this demo.
 */
function fetchText(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

/*
 * extractLinks -- pulls every href="..." and src="..." value out of raw HTML.
 *
 * html: raw HTML text
 * returns: an array of URL strings found in the markup
 *
 * Note: a regex is not a real HTML parser and would break on malformed
 *       or adversarial markup -- that's fine here, because this script's
 *       only job is to imitate a naive crawler, not to be a robust one.
 *       Notice it deliberately does NOT look for <form action="..."> --
 *       real crawlers don't submit forms either, which is exactly why
 *       the safe counter survives this script untouched.
 */
function extractLinks(html) {
  const matches = [...html.matchAll(/(?:href|src)="([^"]+)"/g)];
  return matches.map((m) => m[1]);
}

async function main() {
  console.log(`Crawler starting at ${TARGET}/ ...\n`);
  const html = await fetchText(`${TARGET}/`);
  const links = extractLinks(html);

  console.log(`Found ${links.length} link(s)/image(s) on the page:`);
  for (const link of links) {
    console.log(`  - ${link}`);
  }

  console.log('\nFollowing every one of them, exactly like a real crawler would...\n');
  for (const link of links) {
    // A real crawler does not know or care what a URL "means" -- it just
    // fetches it, the same way this loop does, with no special-casing
    await fetchText(`${TARGET}${link}`);
    console.log(`  fetched ${link}`);
  }

  console.log('\nDone. Reload http://localhost:8000/ in your browser and compare the two counters.');
}

main().catch((err) => {
  console.error('Crawler failed:', err.message);
  process.exit(1);
});
