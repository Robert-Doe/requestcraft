# Module 15 — Decisions: File Upload Abuse

## 1. Node hand-rolls a multipart/form-data parser instead of using multer/busboy
**Decision:** `parseMultipart()` in `node/server.js` is written from
scratch — no `multer`, no `busboy`, no dependency at all.
**Why:** Parsing a multipart body IS this module's underlying mechanic —
understanding where a filename, a Content-Type, and raw file bytes each
come from in the request is exactly what makes the vulnerability (and
the fix) concrete rather than abstract. Reaching for a library would
hide the exact fields (`filename=`, `Content-Type:`) that the
vulnerability trusts, in a black box.
**Trade-off:** This parser is deliberately minimal — it assumes
well-formed CRLF line endings and doesn't handle every edge case a
production multipart parser (or the RFC 7578 spec) accounts for
(nested multipart, unusual charset declarations, malformed boundaries).
A production Node app should use a maintained library precisely because
those edge cases have been hardened against real-world adversarial input
over years — this file exists to teach the mechanism, not to replace that library.

## 2. PHP uses the native `$_FILES` superglobal, not a hand-rolled parser
**Decision:** `php/router.php` reads `$_FILES['avatar']` directly — no
custom multipart parsing code exists in the PHP version at all.
**Why:** Identical reasoning to Module 11's Decision #2: PHP's SAPI
already parses multipart bodies natively, correctly, as part of the
language runtime. Reimplementing that parser in PHP would teach an
anti-pattern (never reinvent what the platform already does correctly)
rather than the mechanism itself, which the Node version already exposes.
**Trade-off:** None — this accurately reflects how real PHP code is written.

## 3. The vulnerability is trusting BOTH the claimed filename extension and the claimed Content-Type
**Decision:** `/upload-vulnerable` saves the file using the client's
original filename verbatim (extension included) and logs, but never
checks, the client's claimed Content-Type.
**Why:** These are two independent, commonly-conflated trust failures.
An attacker controls the `Content-Type` field of a multipart part
completely — it's just text they typed, exactly like a `Content-Type`
header at the top level of any request. An attacker equally controls the
filename they upload as. Believing EITHER one tells you anything true
about the actual bytes is the vulnerability; this module deliberately
defeats both in the same test (a `.php`-named file, sent with
`Content-Type: image/png`) to make clear neither one is a safety check.
**Trade-off:** None — this is the accurate shape of the real vulnerability class.

## 4. The fix identifies file type by magic bytes, never by anything client-supplied
**Decision:** `detectRealImageType()` / `detect_real_image_type()` reads
only the first few bytes of the actual uploaded data and compares them
against known, fixed signatures for PNG, JPEG, and GIF.
**Why:** Magic bytes are a structural property of the file's actual
content — a PNG file begins with the exact byte sequence
`\x89PNG\r\n\x1a\n` because that's part of the PNG format's own
specification, not something the uploader can annotate independently of
providing genuinely PNG-formatted bytes. This is the file-upload
equivalent of Module 14's allowlist: check what the data actually IS,
never what it claims to be.
**Trade-off:** Magic-byte sniffing only proves a file's CONTAINER format
is genuine — it says nothing about the safety of what's encoded inside
that container (a maliciously crafted PNG exploiting a bug in an image
processing library is a real, separate vulnerability class, unrelated to
what this module teaches). It also only covers the three formats this
module implements; a production system would check every format it
intends to accept and reject everything else by default.

## 5. Server-generated filenames, discarding the client's name entirely on the fixed path
**Decision:** `/upload-fixed` never uses any part of the client's
original filename — it generates a random hex name with an extension
chosen from the DETECTED type, not the claimed one.
**Why:** Even a client-supplied filename with a "safe-looking" extension
(`photo.png`) is still attacker-controlled text that could contain path
traversal sequences, unexpected Unicode, or characters meaningful to the
underlying filesystem or a future piece of code that processes filenames
unsafely. Discarding it entirely, rather than trying to sanitize it,
removes an entire category of "did I sanitize this correctly" bugs.
**Trade-off:** A real application usually wants to preserve *some*
notion of the original filename for user-facing display (e.g., "you
uploaded vacation-photo.png") — that's fine to store as a separate,
purely-cosmetic metadata field (in a database, displayed as text, always
HTML-encoded per Module 11 if ever rendered), completely decoupled from
the filename actually used on disk.

## 6. `baseName()`/`basename()` strips path separators even in the "vulnerable" demo
**Decision:** Even `/upload-vulnerable` strips directory components from
the claimed filename before saving — it doesn't literally trust the
entire raw string as a filesystem path.
**Why:** Without this, a filename like `../../../etc/whatever` could
write outside the intended uploads folder — path traversal is a real,
serious, but DIFFERENT vulnerability class than the MIME/extension
spoofing this module focuses on. Leaving true path traversal open in
this demo would risk actually damaging files outside the course
directory when you run it, which serves no teaching purpose and adds
real risk to running the demo. Stripping path separators keeps the
"vulnerable" route vulnerable to exactly the bug being taught, without
being needlessly dangerous to actually execute.
**Trade-off:** This means `/upload-vulnerable` is not a complete,
uncut example of "everything wrong with trusting user input in file
uploads" — path traversal is intentionally out of scope, flagged here
explicitly so you know it's a related, separate concept rather than an oversight.

## 7. Uploaded content is stored, never executed
**Decision:** Nothing in this module runs, includes, or executes any
uploaded file — the demo stops at proving a dangerous file was
successfully stored, extension intact, in a location the vulnerable
route treats as normal.
**Why:** Actually executing an uploaded `.php` file would require
configuring a real PHP-executing web server (Apache/nginx + PHP-FPM,
not `php -S`'s simple router model) pointed at the uploads directory —
meaningfully more setup, and meaningfully more dangerous to run casually,
for a marginal teaching gain. The storage-side flaw alone — a file with
a dangerous extension sitting in a predictable, web-accessible path — is
the actual vulnerability; what happens next depends entirely on how the
hosting environment is configured, which is a deployment concern this
module doesn't need to reproduce to make its point.
**Trade-off:** You won't see a live "shell popped" demonstration here —
only every step up to it. That's a deliberate scope boundary for a
course meant to run safely on your own machine.
