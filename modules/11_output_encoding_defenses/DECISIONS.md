# Module 11 — Decisions: Output Encoding Defenses

## 1. Encoding happens at render time, not at storage time
**Decision:** `stored-fixed/server.js` and its PHP equivalent still
store comments completely raw, exactly as Module 07 did. Encoding is
only ever applied inside `renderGuestbook()` / `render_guestbook()`,
at the moment a value is written into HTML.
**Why:** Encoding at write time would corrupt the stored data: a name
containing a literal `&` would be stored as `&amp;` and stay that way
forever, even if that comment were later exported to JSON, sent through
an email notification, or rendered inside something other than HTML
(a plain-text digest, for instance) — contexts where `&amp;` is simply
wrong, not safe. Encoding belongs exactly at the boundary where a value
is about to become HTML, applied fresh, every time, for that specific
output context — never baked into storage.
**Trade-off:** This means EVERY place that reads `comments` and writes
it somewhere must remember to encode appropriately for wherever it's
going. That responsibility can't be delegated to storage. A production
system typically centralizes this by using a templating engine that
encodes by default (Module 05's Decision #1 already previewed this) so
individual developers don't have to remember to call `enc()` manually at
every single call site.

## 2. Node hand-rolls `encodeHtml()`; PHP uses the real `htmlspecialchars()`
**Decision:** The Node files write their own `encodeHtml()` function from
scratch. The PHP files call PHP's built-in `htmlspecialchars()` directly,
with `ENT_QUOTES` and `'UTF-8'` passed explicitly.
**Why:** This course's rule of "build it from scratch" exists so you
understand a mechanism rather than trust a black box — but PHP already
HAS this mechanism, built into the language runtime, tested against
decades of real-world encoding edge cases. Reimplementing
`htmlspecialchars()` in PHP wouldn't teach a new concept (you already
built the identical logic in Node); it would teach the anti-pattern of
reinventing a standard library function that's already correct, in a
language where the correct tool already exists natively.
**Trade-off:** This does mean the Node and PHP encoders could theoretically
diverge in edge-case behavior (Unicode normalization, null bytes) since
one is hand-rolled and the other is a mature C-backed implementation. For
the ASCII structural characters this course cares about (`&`, `<`, `>`,
`"`, `'`), both behave identically, which is what the Run It section verifies.

## 3. `ENT_QUOTES` is passed explicitly, not left as a default
**Decision:** Every `htmlspecialchars()` call in this module passes
`ENT_QUOTES` as the second argument.
**Why:** PHP's historical default (before PHP 8.1) was `ENT_QUOTES |
ENT_SUBSTITUTE | ENT_HTML401` only as of newer versions — but relying on
"whatever the current default is" is fragile across PHP versions, and
older defaults encoded double quotes but NOT single quotes, silently
leaving single-quoted attributes (`style='...'`) breakable even after
calling the "safe" function. Passing the flag explicitly makes the
encoding behavior a property of the code, not of which PHP version
happens to be running it.
**Trade-off:** None — there is no legitimate reason to encode quotes
selectively; always encoding both is strictly safer and has no
downside for HTML body or attribute contexts.

## 4. The context-demo's "still broken" route is deliberately included, not hidden
**Decision:** `/unquoted-encoded` is left in the demo showing a real,
verified attribute-injection bypass, sitting right next to the actually-safe
`/quoted-encoded` route.
**Why:** The single most dangerous outcome of this module would be a
student walking away believing "I called an encoding function, so I'm
safe" as a universal rule. Showing a verified case where encoding runs
and the attack STILL succeeds — because of a missing quote, not a
missing encode — is the only way to make "context matters, not just
encoding" land as something proven rather than asserted.
**Trade-off:** None — this is the entire pedagogical point of the module,
verified empirically (see the Run It section) rather than only claimed.

## 5. The attribute-injection payload uses a space, not `<`, `>`, `"`, or `'`
**Decision:** The proof payload is `red onmouseover=alert(1)` — none of
the five characters `encodeHtml()`/`htmlspecialchars()` actually encode
appear in it at all.
**Why:** This is exactly what makes the bypass work, and exactly why it's
worth dwelling on: a student's first instinct after Module 05 is often
"encoding handles the dangerous characters," implicitly meaning
`< > & " '`. This payload proves that an UNQUOTED attribute has a sixth
dangerous character encoding functions don't touch: whitespace. That's
not a gap in `encodeHtml()`'s character set — no reasonable HTML-body
encoder should encode spaces, since spaces are completely harmless in
body text. It's a gap in using body-text encoding for an attribute
context without also quoting the attribute, which is Decision #4's whole point.
