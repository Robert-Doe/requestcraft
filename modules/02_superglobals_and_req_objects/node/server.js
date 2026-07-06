/*
 * server.js
 *
 * Module 02: Superglobals & req Objects.
 *
 * Takes the exact same raw bytes Module 01 printed to your terminal
 * and parses them into structured key/value data -- the Node
 * equivalent of what PHP calls "superglobals" ($_GET, $_POST,
 * $_SERVER). This file hand-rolls that parsing instead of reaching
 * for Node's built-in querystring module, because parsing IS the
 * concept this module teaches -- using a library here would skip the
 * one thing you're here to learn.
 *
 * Introduced in: Module 02.
 * Previous module's equivalent: node/raw_server.js (Module 01) --
 * that file printed raw bytes; this file is the first to interpret them.
 * Prerequisite concepts: Module 01 (HTTP Request Anatomy) -- you must
 * already be comfortable with the idea that a GET's data lives in the
 * URL and a POST's data lives in the body, as raw text.
 */

'use strict';

const http = require('http'); // one level above Module 01's raw 'net' -- 'http' handles framing (headers/body split) for us, but NOT query/body parsing, which we still do by hand below

const PORT = 8000;
const MAX_BODY_BYTES = 1_000_000; // 1 MB cap -- generous for form data, small enough that a misbehaving client can't force unbounded buffering (see DECISIONS.md #5)

/*
 * parseFormEncoded -- turns "name=bob&role=chef" into { name: 'bob', role: 'chef' }.
 *
 * text: raw x-www-form-urlencoded text, e.g. a query string (no leading
 *       '?') or a POST body -- both use the identical encoding
 * returns: a plain object of decoded key/value pairs
 *
 * Assumes: '&' separates pairs and '=' separates key from value.
 * Note: a repeated key (?a=1&a=2) overwrites rather than collecting into
 *       an array -- see DECISIONS.md #3 for why that's a deliberate
 *       simplification at this stage, not an oversight.
 */
function parseFormEncoded(text) {
  const result = {};
  if (text === '') return result; // nothing to parse -- avoid a bogus {'': ''} entry

  for (const pair of text.split('&')) {
    const eqIndex = pair.indexOf('=');
    // a pair with no '=' (just "flag" instead of "flag=value") has no value
    const rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
    const rawValue = eqIndex === -1 ? '' : pair.slice(eqIndex + 1);

    // '+' means literal space in this encoding (a quirk of x-www-form-urlencoded,
    // not of percent-encoding generally) -- must be handled before decodeURIComponent
    const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    const value = decodeURIComponent(rawValue.replace(/\+/g, ' '));

    result[key] = value; // later keys overwrite earlier ones -- see DECISIONS.md #3
  }
  return result;
}

/*
 * readBody -- collects a request's body into a single string, with a size cap.
 *
 * req: the incoming http.IncomingMessage
 * returns: a Promise resolving to the full body text
 *
 * Assumes: the body is small text (form data), not a large binary upload --
 *          Module 15 (File Upload Abuse) revisits this assumption directly.
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let received = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      received += chunk.length;
      if (received > MAX_BODY_BYTES) {
        // Stop trusting this client immediately -- a runaway body is either
        // a bug or a resource-exhaustion attempt, and there is no legitimate
        // reason at this stage to buffer past our cap
        req.destroy();
        reject(new Error('Body too large'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject); // caller's .catch already logs -- nothing else to clean up here
  });
}

const server = http.createServer(async (req, res) => {
  // req.url is only path+query, e.g. "/search?q=hello" -- 'http' already
  // split this off the request line for us (unlike Module 01's raw bytes)
  const [path, queryString = ''] = req.url.split('?');

  const getParams = parseFormEncoded(queryString); // Node's equivalent of PHP's $_GET

  let postParams = {}; // Node's equivalent of PHP's $_POST -- stays empty for a GET request
  if (req.method === 'POST') {
    const body = await readBody(req);
    postParams = parseFormEncoded(body); // same parser -- POST bodies and query strings share one encoding
  }

  // This dump IS Module 02's "visible proof it works" -- printed to both
  // the server console (so you see it happen) and the HTTP response
  // (so curl shows it to you directly)
  const dump = {
    method: req.method, // Node's equivalent of PHP's $_SERVER['REQUEST_METHOD']
    path,
    GET: getParams,
    POST: postParams,
  };

  console.log(JSON.stringify(dump, null, 2));

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(dump, null, 2) + '\n');
});

server.listen(PORT, () => {
  console.log(`Superglobals demo server up on http://localhost:${PORT}`);
  console.log('Try: curl "http://localhost:8000/search?q=hello&sort=asc"');
  console.log('Try: curl -X POST http://localhost:8000/submit -d "name=bob&role=chef"\n');
});
