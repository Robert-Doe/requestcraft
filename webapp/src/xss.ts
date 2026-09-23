/**
 * xss.ts, ports the exact vulnerable-then-fixed pattern from this course's
 * own modules:
 *
 *   - modules/05_reflected_xss_via_get/node/server.js: vulnerableSearchPage()
 *     drops a raw, attacker-controllable value straight into an HTML
 *     template literal with zero encoding, the canonical reflected-XSS
 *     shape this course teaches.
 *
 *   - modules/11_output_encoding_defenses/tutorial.html: the fix is a single
 *     `encodeHtml()` call around that same value. The function below is
 *     copied field-for-field (same five replacements, same order, the
 *     tutorial itself notes `&` MUST run first or the later replacements
 *     re-escape entities they just created).
 *
 * SAFETY: per this demo's publishing constraint, neither the vulnerable nor
 * the hardened HTML is ever injected into this page's own DOM. Both are
 * rendered only inside a sandboxed <iframe sandbox="allow-scripts"> (no
 * allow-same-origin) via srcdoc, so any script that does execute runs in an
 * opaque, cross-origin, cookie-less context that cannot touch this page,
 * this origin, or any visitor data, it can only postMessage a result back.
 */

/** Ported verbatim from encodeHtml() in modules/11_output_encoding_defenses/tutorial.html. */
export function encodeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;") // MUST run first -- else this step re-escapes entities the next lines just created
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Builds the sandboxed document shown in the reflected-XSS demo pane.
 *
 * rawValue: the visitor's own comment text, unmodified.
 * hardened: false reproduces Module 05's vulnerable echo; true reproduces
 *           Module 11's fix (same template, one function call added).
 *
 * The generated document reports back via postMessage rather than doing
 * anything else, so the parent page can show a live "executed" / "did not
 * execute" verdict without granting the iframe same-origin access.
 */
export function buildReflectedDoc(rawValue: string, hardened: boolean): string {
  const rendered = hardened ? encodeHtml(rawValue) : rawValue;

  // The reporter script runs inside the sandboxed iframe itself. It never
  // reads anything from the parent and never needs same-origin access --
  // postMessage works across origins by design, which is exactly why it's
  // the right channel for a sandboxed, allow-same-origin-less frame.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;margin:16px;color:#111;background:#fff;">
  <p style="margin:0 0 12px 0;font-size:13px;color:#555;">Rendered inside a sandboxed, cross-origin iframe -- it cannot read cookies, the DOM, or anything else on the real page.</p>
  <p>You commented: <span id="reflected-value">${rendered}</span></p>
  <script>
    (function () {
      var executed = false;
      window.__reportXss = function () {
        executed = true;
        parent.postMessage({ source: 'requestcraft-xss-demo', executed: true, hardened: ${JSON.stringify(hardened)} }, '*');
      };
      // Give any injected markup (e.g. an onerror handler) a tick to fire.
      setTimeout(function () {
        if (!executed) {
          parent.postMessage({ source: 'requestcraft-xss-demo', executed: false, hardened: ${JSON.stringify(hardened)} }, '*');
        }
      }, 150);
    })();
  </script>
</body></html>`;
}
