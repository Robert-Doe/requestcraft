# Module 07 — Decisions: Stored XSS via POST

## 1. In-memory array (Node) vs. JSON file (PHP), same as Module 04
**Decision:** `node/server.js` keeps comments in a plain array in memory;
`php/router.php` persists them to `comments.json`.
**Why:** This is the identical persistence contrast Module 04 introduced,
now applied to something with real stakes: previously it was a harmless
counter, and now it's arbitrary attacker-supplied HTML that survives
between requests. Recognizing "this data outlives the request that
created it" is exactly what separates stored XSS from Module 05's
reflected XSS.
**Trade-off:** Same as Module 04, Decision #6 — no locking around the
PHP file's read-modify-write cycle, which a production system storing
real user comments would need to address with a database transaction.

## 2. No output encoding anywhere in the render path — identical bug shape to Module 05
**Decision:** `renderGuestbook()` interpolates `c.name` and `c.message`
directly into HTML, with no escaping, for every comment in the array.
**Why:** The entire point of this module is that stored XSS is NOT a
different vulnerability from reflected XSS — it's the exact same
missing-encoding bug, at the exact same kind of sink, with one variable
changed: WHEN the sink fires, and for WHOM. Module 05's sink fired once,
immediately, only for whoever clicked a crafted link. This module's sink
fires on every single page load, for every visitor, indefinitely, because
the comments array (or file) is read and rendered fresh every time `/` is
requested.
**Trade-off:** None beyond what Module 05 already named — this is a
direct continuation of that module's vulnerability, now shown in its
more dangerous, self-perpetuating form. Module 11 fixes both files with
the same encoding technique, because it's the same bug.

## 3. No validation or length limit on submitted comments
**Decision:** `/comment` accepts any string of any length for both
`name` and `message`, with only a "field is required" check on the
client side (which an attacker sending a raw POST with curl can ignore
entirely).
**Why:** Introducing validation here would blur this module's one
concept (storage turns a one-time reflected bug into a persistent one)
with a different concept — allowlist validation as defense-in-depth,
which is Module 14's entire subject. Keeping this module's vulnerable
surface minimal and unvalidated makes the storage-vs-reflection
distinction the only variable that changed from Module 05.
**Trade-off:** A real guestbook needs limits (message length, rate
limiting on submissions, spam detection) that have nothing to do with
XSS specifically and everything to do with abuse prevention generally.
None of that is in scope here.

## 4. Append-only — no edit or delete functionality
**Decision:** The guestbook can only grow. There's no route to remove or
modify a previously stored comment.
**Why:** Edit/delete would require adding authentication or ownership
tracking (whose comment is this, who's allowed to remove it) — an entire
subsystem unrelated to XSS. Keeping the demo to "submit" and "view" is
the minimum needed to demonstrate that stored data attacks future
visitors, without introducing unrelated complexity.
**Trade-off:** A real guestbook or comment system absolutely needs
moderation tools — in fact, moderation itself is a common place stored
XSS bugs are found in practice, since an admin's moderation dashboard is
often exactly the page that renders raw, unescaped user content for staff
review.

## 5. Comments array/file has no size cap
**Decision:** Nothing in this module stops the comments list from growing
without bound, and the whole list is re-rendered on every page load.
**Why:** Adding pagination or a maximum stored-comment count would be
solving a scalability problem, which is unrelated to the security concept
this module teaches.
**Trade-off:** A production guestbook would paginate results and likely
cap total storage — an unbounded, un-paginated comment feed is both a
performance problem and, incidentally, makes the stored-XSS blast radius
worse (every visitor loads and executes every stored comment, forever,
on one page). That compounding effect is real and worth remembering: the
more content a single page renders, the more exposure surface a single
missed encoding call creates.
