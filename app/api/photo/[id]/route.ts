import { ATOM_API_BASE_URL } from "@/lib/atom-api";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  if (!/^https?:\/\//i.test(u)) return badRequest("invalid u scheme");

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
