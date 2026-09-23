import "./style.css";
import { buildRequestPreview, accessLogLine, type FormFields } from "./request";
import { buildReflectedDoc } from "./xss";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="topbar">
    <div class="brand">request<span>craft</span></div>
    <nav>
      <a href="https://github.com/Robert-Doe/requestcraft" target="_blank" rel="noopener">GitHub</a>
      <a href="https://robertdoe.com">&larr; robertdoe.com</a>
    </nav>
  </div>

  <div class="hero">
    <h1>GET vs POST, Made Visible</h1>
    <p class="tagline">
      This course's own restaurant analogy: <strong>GET is reading the
      menu</strong>, nothing in the kitchen changes. <strong>POST is
      handing in an order ticket</strong> that changes what the kitchen
      does. Edit the fields below and watch exactly what each method sends,
      and where.
    </p>
  </div>

  <section class="card">
    <h2>1. Build a request</h2>
    <p class="sub">A couple of fields, just like the course's own form demos in Module 03.</p>
    <div class="panes">
      <div>
        <div class="field-row">
          <label for="f-name">Name</label>
          <input id="f-name" type="text" value="Ada" spellcheck="false" />
        </div>
        <div class="field-row">
          <label for="f-comment">Comment</label>
          <input id="f-comment" type="text" value="&lt;img src=x onerror=__reportXss()&gt;" spellcheck="false" />
        </div>

        <label>Send as</label>
        <div class="toggle-row" id="method-toggle">
          <button class="toggle-btn active" data-method="GET">Send as GET</button>
          <button class="toggle-btn" data-method="POST">Send as POST</button>
        </div>

        <div id="post-format-row" class="toggle-row" style="display:none">
          <button class="toggle-btn active" data-format="urlencoded">application/x-www-form-urlencoded</button>
          <button class="toggle-btn" data-format="json">application/json</button>
        </div>
      </div>

      <div>
        <div class="output">
          <span class="label" id="url-label">Resulting URL</span>
          <span class="value" id="url-value"></span>
        </div>
        <div class="output" id="body-output" style="display:none">
          <span class="label">Request body</span>
          <span class="value" id="body-value"></span>
        </div>
        <div class="output">
          <span class="label">Simulated server access log</span>
          <span class="value" id="log-value"></span>
        </div>
        <div class="note" id="method-note"></div>
      </div>
    </div>
  </section>

  <section class="card">
    <h2>2. Reflect this in the page</h2>
    <p class="sub">
      The course's Module 05 (Reflected XSS via GET) echoes a raw value
      straight into the response HTML with no encoding. This renders that
      exact pattern &mdash; safely, inside a sandboxed, cross-origin iframe
      that cannot touch this page, your cookies, or anything else on this
      site.
    </p>

    <label class="switch-row" id="reflect-row">
      <input type="checkbox" id="reflect-toggle" />
      <span>Reflect the comment field into the sandboxed frame below</span>
    </label>
    <label class="switch-row" id="harden-row" style="display:none">
      <input type="checkbox" id="harden-toggle" />
      <span>Harden: HTML-escape the value first (Module 11's fix)</span>
    </label>

    <div id="xss-area" style="display:none">
      <div class="xss-frame-wrap">
        <iframe id="xss-frame" sandbox="allow-scripts" title="sandboxed reflected value"></iframe>
      </div>
      <div class="verdict" id="xss-verdict">Waiting for the sandboxed frame to report back&hellip;</div>
    </div>
  </section>

  <footer>
    <span>Requestcraft &mdash; GET, POST, and everything that goes wrong in between.</span>
    <a href="https://github.com/Robert-Doe/requestcraft" target="_blank" rel="noopener">Source on GitHub</a>
  </footer>
`;

// ------------------------------------------------------------- request UI --
const nameInput = document.querySelector<HTMLInputElement>("#f-name")!;
const commentInput = document.querySelector<HTMLInputElement>("#f-comment")!;
const methodButtons = document.querySelectorAll<HTMLButtonElement>("#method-toggle .toggle-btn");
const formatButtons = document.querySelectorAll<HTMLButtonElement>("#post-format-row .toggle-btn");
const postFormatRow = document.querySelector<HTMLDivElement>("#post-format-row")!;
const urlLabel = document.querySelector<HTMLSpanElement>("#url-label")!;
const urlValue = document.querySelector<HTMLSpanElement>("#url-value")!;
const bodyOutput = document.querySelector<HTMLDivElement>("#body-output")!;
const bodyValue = document.querySelector<HTMLSpanElement>("#body-value")!;
const logValue = document.querySelector<HTMLSpanElement>("#log-value")!;
const methodNote = document.querySelector<HTMLDivElement>("#method-note")!;

let currentMethod: "GET" | "POST" = "GET";
let currentFormat: "urlencoded" | "json" = "urlencoded";

function fields(): FormFields {
  return { name: nameInput.value, comment: commentInput.value };
}

function renderRequest() {
  const preview = buildRequestPreview(currentMethod, "/comments", fields(), currentFormat);

  if (currentMethod === "GET") {
    urlLabel.textContent = "Resulting URL (query string is real, URL-encoded data)";
    urlValue.textContent = `https://requestcraft.example${preview.url}`;
    bodyOutput.style.display = "none";
    methodNote.className = "note danger";
    methodNote.textContent =
      "GET puts every field in the URL. It's visible in the address bar, gets bookmarked, gets shared as a plain link, and is recorded in server access logs and browser history exactly as shown above.";
  } else {
    urlLabel.textContent = "Resulting URL (unchanged -- no field data here)";
    urlValue.textContent = `https://requestcraft.example${preview.url}`;
    bodyOutput.style.display = "block";
    bodyValue.textContent = `Content-Type: ${preview.bodyContentType}\n\n${preview.body}`;
    methodNote.className = "note success";
    methodNote.textContent =
      "POST puts the fields in the request body instead. The URL never changes, so it isn't bookmarked, isn't shared as a link, and a real access log line for this request has no query string at all.";
  }

  logValue.textContent = accessLogLine(preview);
}

methodButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentMethod = btn.dataset.method as "GET" | "POST";
    methodButtons.forEach((b) => b.classList.toggle("active", b === btn));
    postFormatRow.style.display = currentMethod === "POST" ? "flex" : "none";
    renderRequest();
  });
});

formatButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFormat = btn.dataset.format as "urlencoded" | "json";
    formatButtons.forEach((b) => b.classList.toggle("active", b === btn));
    renderRequest();
  });
});

[nameInput, commentInput].forEach((el) => el.addEventListener("input", () => {
  renderRequest();
  if (reflectToggle.checked) renderXss();
}));

renderRequest();

// ----------------------------------------------------------------- XSS UI --
const reflectToggle = document.querySelector<HTMLInputElement>("#reflect-toggle")!;
const hardenToggle = document.querySelector<HTMLInputElement>("#harden-toggle")!;
const hardenRow = document.querySelector<HTMLLabelElement>("#harden-row")!;
const xssArea = document.querySelector<HTMLDivElement>("#xss-area")!;
const xssFrame = document.querySelector<HTMLIFrameElement>("#xss-frame")!;
const xssVerdict = document.querySelector<HTMLDivElement>("#xss-verdict")!;

function renderXss() {
  const hardened = hardenToggle.checked;
  const doc = buildReflectedDoc(commentInput.value, hardened);
  xssFrame.srcdoc = doc;
  xssVerdict.className = "verdict";
  xssVerdict.textContent = "Waiting for the sandboxed frame to report back…";
}

reflectToggle.addEventListener("change", () => {
  const on = reflectToggle.checked;
  xssArea.style.display = on ? "block" : "none";
  hardenRow.style.display = on ? "flex" : "none";
  if (on) renderXss();
});

hardenToggle.addEventListener("change", () => {
  if (reflectToggle.checked) renderXss();
});

window.addEventListener("message", (event: MessageEvent) => {
  const data = event.data;
  if (!data || data.source !== "requestcraft-xss-demo") return;
  // Only trust messages from our own sandboxed frame.
  if (event.source !== xssFrame.contentWindow) return;

  if (data.executed) {
    xssVerdict.className = "verdict executed";
    xssVerdict.textContent =
      "EXECUTED -- the injected markup ran inside the sandboxed frame (isolated from this page and your cookies, but this is exactly what a real, unsandboxed page would let an attacker run against a real visitor).";
  } else {
    xssVerdict.className = "verdict blocked";
    xssVerdict.textContent = data.hardened
      ? "BLOCKED -- HTML-escaped first (Module 11's fix), so the markup rendered as inert text instead of a live element."
      : "No executable markup detected in this value -- try the default payload or your own <img src=x onerror=...> style value.";
  }
});
