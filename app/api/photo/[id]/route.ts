/**
 * Server-side proxy to fetch document binaries (images) from the ATOM backend.
 *
 * Why a proxy at all:
 *   - The browser must not see `ATOM_API_BASE_URL` (it would let an attacker
 *     hit the backend directly, bypassing any future auth on this app).
 *   - The upstream endpoint is `POST /api/infos/resource` with a JSON body
 *     `{ id, uri }` — the browser cannot do that easily for an `<img src>`.
 *
 * Flow per request:
 *   1. Validate the `id` path param is a UUID (rejects garbage early).
 *   2. Validate the `?u=` query is a parseable http(s) URL whose host is in
 *      the SSRF allow-list (`ATOM_API_BASE_URL` host or LeanIX CDN).
 *   3. POST to `${ATOM_API_BASE_URL}/api/infos/resource` with `{id, uri}`.
 *   4. Stream the response body back with the upstream `Content-Type` and a
 *      long `Cache-Control` (24h immutable — the doc-ref id changes when the
 *      content does).
 *   5. Any upstream failure → `404 photo unavailable`. The client `<img>` has
 *      an `onError` that swaps to a local placeholder.
 */
import { ATOM_API_BASE_URL } from "@/lib/atom-api";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// SSRF guard: only forward upstream `u` if its hostname matches the ATOM API
// host or a known document CDN (LeanIX). Any other host is rejected.
const ALLOWED_HOSTS = new Set<string>([
  new URL(ATOM_API_BASE_URL).host,
  "eu-6.leanix.net",
]);

function badRequest(reason: string): Response {
  return new Response(reason, {
    status: 400,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function notFound(): Response {
  return new Response("photo unavailable", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return badRequest("invalid id");

  const u = new URL(req.url).searchParams.get("u");
  if (!u) return badRequest("missing u");
  let parsedU: URL;
  try {
    parsedU = new URL(u);
  } catch {
    return badRequest("invalid u");
  }
  if (parsedU.protocol !== "http:" && parsedU.protocol !== "https:")
    return badRequest("invalid u scheme");
  if (!ALLOWED_HOSTS.has(parsedU.host))
    return badRequest("u host not allowed");

  const upstream = `${ATOM_API_BASE_URL}/api/infos/resource`;
  const body = JSON.stringify({ id, uri: u });

  console.log(`[photo proxy] POST ${upstream} body=${body}`);

  let res: Response;
  try {
    res = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
  } catch (err) {
    console.warn(`[photo proxy] network error fetching ${id}:`, err);
    return notFound();
  }

  if (!res.ok || !res.body) {
    let preview = "";
    try {
      preview = (await res.text()).slice(0, 300);
    } catch {}
    console.warn(
      `[photo proxy] upstream ${res.status} ${res.statusText} ct=${res.headers.get(
        "Content-Type",
      )} body=${preview}`,
    );
    return notFound();
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    res.headers.get("Content-Type") ?? "application/octet-stream",
  );
  const len = res.headers.get("Content-Length");
  if (len) headers.set("Content-Length", len);
  headers.set("Cache-Control", "public, max-age=86400, immutable");

  return new Response(res.body, { status: 200, headers });
}
