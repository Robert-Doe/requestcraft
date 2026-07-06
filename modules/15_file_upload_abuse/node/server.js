/*
 * server.js
 *
 * Module 15: File Upload Abuse.
 *
 * A hand-rolled multipart/form-data parser (no multer, no busboy --
 * parsing multipart bodies IS the concept this module teaches) backing
 * two upload routes: /upload-vulnerable trusts the client-supplied
 * filename extension and Content-Type at face value; /upload-fixed
 * ignores both and instead sniffs the file's actual magic bytes,
 * accepting only content that is structurally a real image.
 *
 * Introduced in: Module 15.
 * Previous module's equivalent: none directly -- this module reuses
 * Module 02's "hand-roll the parser" ethos, applied to a new body
 * format (multipart) instead of form-urlencoded.
 * Prerequisite concepts: Module 02 (Superglobals & req Objects) for the
 * general body-parsing mindset; Module 14 (Input Validation as
 * Defense-in-Depth) for why validating actual CONTENT beats trusting a
 * claimed label.
 *
 * DO NOT copy /upload-vulnerable into real code. This demo never
 * executes uploaded content -- it only proves the storage-side flaw
 * (see DECISIONS.md #7).
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8000;
const VULN_DIR = path.join(__dirname, 'uploads-vulnerable');
const FIXED_DIR = path.join(__dirname, 'uploads-fixed');

// Known magic-byte signatures for real image formats -- used ONLY by
// the fixed route. The client's claimed Content-Type is never consulted.
const MAGIC_BYTES = [
  { ext: 'png', sig: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
  { ext: 'jpg', sig: Buffer.from([0xff, 0xd8, 0xff]) },
  { ext: 'gif', sig: Buffer.from('GIF87a', 'ascii') }, // GIF89a shares the first 3 bytes; checked separately below
];

/*
 * detectRealImageType -- inspects the first few bytes of a buffer and
 * returns the actual file type, ignoring any claimed extension/MIME type.
 *
 * data: the raw uploaded file bytes
 * returns: 'png' | 'jpg' | 'gif' | null (null = not a recognized image)
 */
function detectRealImageType(data) {
  for (const { ext, sig } of MAGIC_BYTES) {
    if (data.subarray(0, sig.length).equals(sig)) return ext;
  }
  if (data.subarray(0, 6).toString('ascii') === 'GIF89a') return 'gif';
  return null;
}

/*
 * parseMultipart -- hand-rolled multipart/form-data body parser.
 *
 * body: the raw request body as a Buffer
 * boundary: the boundary string extracted from the Content-Type header
 * returns: an array of { name, filename, contentType, data } parts
 *
 * Assumes: a well-formed multipart body with CRLF line endings, per
 *          RFC 7578 -- this is a teaching parser, not a hardened one
 *          (see DECISIONS.md #1).
 */
function parseMultipart(body, boundary) {
  const marker = Buffer.from(`--${boundary}`);
  const parts = [];
  let searchStart = 0;

  while (true) {
    const start = body.indexOf(marker, searchStart);
    if (start === -1) break;
    const nextMarkerStart = body.indexOf(marker, start + marker.length);
    if (nextMarkerStart === -1) break;

    // Content of this part sits between the end of this boundary line
    // and the start of the next boundary line
    const partStart = start + marker.length + 2; // skip marker + CRLF
    const partRaw = body.subarray(partStart, nextMarkerStart);

    const headerEnd = partRaw.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const headerText = partRaw.subarray(0, headerEnd).toString('utf8');
      // strip the trailing \r\n that precedes the next boundary marker
      const data = partRaw.subarray(headerEnd + 4, partRaw.length - 2);

      const nameMatch = /name="([^"]*)"/.exec(headerText);
      const filenameMatch = /filename="([^"]*)"/.exec(headerText);
      const contentTypeMatch = /Content-Type:\s*([^\r\n]*)/i.exec(headerText);

      parts.push({
        name: nameMatch ? nameMatch[1] : '',
        filename: filenameMatch ? filenameMatch[1] : null,
        contentType: contentTypeMatch ? contentTypeMatch[1].trim() : null,
        data,
      });
    }

    searchStart = nextMarkerStart;
  }
  return parts;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/*
 * baseName -- strips any directory components from a client-supplied
 * filename, keeping only the final segment.
 *
 * name: a raw, attacker-controllable filename string
 * returns: the filename with no path separators
 *
 * Note: this ONLY prevents path traversal (writing outside the uploads
 * folder) -- it does nothing about the extension/MIME spoofing this
 * module is actually about. Kept minimal on purpose (see DECISIONS.md #6).
 */
function baseName(name) {
  return name.replace(/^.*[\\/]/, '');
}

function page(title, bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:sans-serif;max-width:640px;margin:40px auto;">${bodyHtml}</body></html>`;
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];

  if (urlPath === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('Module 15', `
      <h1>Module 15 &mdash; File Upload Abuse</h1>
      <form method="post" action="/upload-vulnerable" enctype="multipart/form-data">
        <p>Vulnerable upload: <input type="file" name="avatar"><button type="submit">Upload (vulnerable)</button></p>
      </form>
      <form method="post" action="/upload-fixed" enctype="multipart/form-data">
        <p>Fixed upload: <input type="file" name="avatar"><button type="submit">Upload (fixed)</button></p>
      </form>
    `));
    return;
  }

  if ((urlPath === '/upload-vulnerable' || urlPath === '/upload-fixed') && req.method === 'POST') {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType);
    const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;

    if (!boundary) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Expected multipart/form-data\n');
      return;
    }

    const body = await readRawBody(req);
    const parts = parseMultipart(body, boundary);
    const avatar = parts.find((p) => p.name === 'avatar' && p.filename);

    if (!avatar) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('No file uploaded\n');
      return;
    }

    if (urlPath === '/upload-vulnerable') {
      // THE VULNERABILITY: the ORIGINAL filename (and its extension) is
      // trusted completely. The client-supplied Content-Type is also
      // never checked against the actual bytes. An attacker who names
      // their upload "evil.php" and claims Content-Type: image/png gets
      // exactly that file saved, extension and all.
      const safeName = baseName(avatar.filename); // path traversal protection only -- NOT the fix (see DECISIONS.md #6)
      fs.writeFileSync(path.join(VULN_DIR, safeName), avatar.data);
      console.log(`[upload-vulnerable] saved "${safeName}" -- claimed Content-Type: ${avatar.contentType}`);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`Saved as ${safeName} (trusted claimed extension + Content-Type: ${avatar.contentType})\n`);
      return;
    }

    // THE FIX: detect the REAL file type from its actual bytes. The
    // client's filename and Content-Type are completely ignored for
    // this decision -- only what's structurally true of the data matters.
    const realType = detectRealImageType(avatar.data);
    if (!realType) {
      console.log(`[upload-fixed] REJECTED -- claimed "${avatar.filename}" (${avatar.contentType}) is not a real image by content`);
      res.writeHead(415, { 'Content-Type': 'text/plain' });
      res.end('415 Unsupported Media Type -- file content is not a recognized image format\n');
      return;
    }

    // Server generates its own random filename with the DETECTED
    // extension -- the client's claimed filename is discarded entirely
    const generatedName = `${crypto.randomBytes(8).toString('hex')}.${realType}`;
    fs.writeFileSync(path.join(FIXED_DIR, generatedName), avatar.data);
    console.log(`[upload-fixed] saved as "${generatedName}" -- detected real type: ${realType}`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Saved as ${generatedName} (detected real type: ${realType})\n`);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Module 15 file-upload demo up on http://localhost:${PORT}`);
});
