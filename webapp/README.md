# Requestcraft web demo

An interactive, client-side-only demo (no backend) built on this course's
own logic:

- **GET vs POST encoding** — a real port of the `parseFormEncoded()` /
  access-log pattern used throughout `modules/03_forms_and_method_semantics`
  and later modules: GET serializes your fields into a real URL-encoded
  query string on the URL; POST serializes them into a request body
  (`application/x-www-form-urlencoded` or JSON) with the URL left
  untouched. A simulated access-log line shows exactly what a real server
  log would (and wouldn't) capture for each.

- **Reflected XSS, attack then defense** — reproduces
  `modules/05_reflected_xss_via_get`'s vulnerable echo and
  `modules/11_output_encoding_defenses`'s `encodeHtml()` fix, ported
  field-for-field. For safety on a public demo, this scenario is **only**
  ever rendered inside a sandboxed `<iframe sandbox="allow-scripts">` (no
  `allow-same-origin`) via `srcdoc`, and the result is reported back to the
  page over `postMessage` — the sandboxed frame can never read this page's
  DOM, cookies, or origin.

No data leaves your browser; there is no backend and nothing persists
across visitors.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deploying

This is a static site — no server or environment variables needed. On
Vercel, Netlify, or Cloudflare Pages:

- **Root directory:** `webapp`
- **Build command:** `npm run build`
- **Output directory:** `dist`
