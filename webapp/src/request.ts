/**
 * request.ts — port of the request-encoding logic used throughout the
 * Requestcraft course's node/server.js files (modules 02–04), specifically
 * the hand-rolled `parseFormEncoded()` helper reused verbatim across every
 * module (see e.g. modules/03_forms_and_method_semantics/node/server.js).
 *
 * That helper DECODES application/x-www-form-urlencoded text. This file
 * provides its exact counterpart — a real ENCODER that produces the same
 * wire format — plus the two request shapes the course's Module 03
 * ("Forms & Method Semantics") contrasts directly: a GET whose fields live
 * in the URL's query string, and a POST whose fields live in the body with
 * an unchanged URL.
 */

export interface FormFields {
  name: string;
  comment: string;
}

/**
 * Encodes one component the way a browser encodes a real
 * application/x-www-form-urlencoded form: percent-encode via
 * encodeURIComponent, then turn %20 (space) into '+' — this is the exact
 * inverse of parseFormEncoded()'s `.replace(/\+/g, ' ')` step in the
 * course's own node/server.js files.
 */
export function encodeFormComponent(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

/** Same algorithm as parseFormEncoded() in the course's node/server.js, kept for round-trip parity checks. */
export function decodeFormComponent(value: string): string {
  return decodeURIComponent(value.replace(/\+/g, " "));
}

export function serializeFormEncoded(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([k, v]) => `${encodeFormComponent(k)}=${encodeFormComponent(v)}`)
    .join("&");
}

export function serializeAsJson(fields: Record<string, string>): string {
  return JSON.stringify(fields, null, 2);
}

export interface RequestPreview {
  method: "GET" | "POST";
  url: string;
  body: string | null;
  bodyContentType: string | null;
  visibleInAddressBar: boolean;
  loggedByServer: boolean;
}

/**
 * Builds the exact request shape the course's Module 03 demonstrates:
 * GET puts the query string in the URL (visible in the address bar,
 * bookmarkable, and recorded in a real access log line — see
 * accessLogLine() in the course's node/server.js); POST puts the data in
 * the body with the URL left unchanged, and a real access log records only
 * the method + path, never the body.
 */
export function buildRequestPreview(
  method: "GET" | "POST",
  basePath: string,
  fields: FormFields,
  postFormat: "urlencoded" | "json" = "urlencoded"
): RequestPreview {
  const asRecord: Record<string, string> = { name: fields.name, comment: fields.comment };

  if (method === "GET") {
    const qs = serializeFormEncoded(asRecord);
    return {
      method,
      url: qs ? `${basePath}?${qs}` : basePath,
      body: null,
      bodyContentType: null,
      visibleInAddressBar: true,
      loggedByServer: true,
    };
  }

  const body = postFormat === "json" ? serializeAsJson(asRecord) : serializeFormEncoded(asRecord);
  const bodyContentType = postFormat === "json" ? "application/json" : "application/x-www-form-urlencoded";

  return {
    method,
    url: basePath,
    body,
    bodyContentType,
    visibleInAddressBar: false,
    loggedByServer: false,
  };
}

/** Mirrors accessLogLine() from the course's node/server.js: a real access log records the URL, never a POST body. */
export function accessLogLine(preview: RequestPreview): string {
  return `[ACCESS LOG] ${preview.method} ${preview.url}`;
}
