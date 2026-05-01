/**
 * PDF export endpoint for the filtered LTM catalogue.
 *
 * Receives the already-filtered LabTestMean[] from the client (no backend
 * refetch — keeps the export fast and resilient to backend flakiness),
 * resolves each cover photo by hitting the ATOM backend directly (bypassing
 * the local photo proxy to avoid loopback latency), and renders the PDF
 * document via @react-pdf/renderer.
 */
import { renderToBuffer } from "@react-pdf/renderer";
import CatalogueExport, {
  type ResolvedBench,
} from "@/components/pdf/CatalogueExport";
import { ATOM_API_BASE_URL } from "@/lib/atom-api";
import type { LabTestMean } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const PHOTO_TIMEOUT_MS = 5_000;
const MAX_BENCHES = 500;

const ALLOWED_PHOTO_HOSTS = new Set<string>([
  new URL(ATOM_API_BASE_URL).host,
  "eu-6.leanix.net",
]);

/**
 * Extract the upstream `id` (UUID path segment) and `u` (encoded URL) from
 * the local proxy URL the adapter wrote into `coverPhoto`. Returns null when
 * the cover is the static placeholder or the URL is malformed.
 */
function parseProxyUrl(
  proxyUrl: string,
): { id: string; uri: string } | null {
  if (!proxyUrl.startsWith("/api/photo/")) return null;
  const match = proxyUrl.match(/^\/api\/photo\/([^?]+)\?u=(.+)$/);
  if (!match) return null;
  const [, id, encodedUri] = match;
  try {
    const uri = decodeURIComponent(encodedUri);
    const host = new URL(uri).host;
    if (!ALLOWED_PHOTO_HOSTS.has(host)) return null;
    return { id, uri };
  } catch {
    return null;
  }
}

/**
 * Detect image format from magic bytes. PDFKit (used by @react-pdf/renderer)
 * parses the binary based on the data URL prefix — using the upstream
 * Content-Type is unreliable (some backends mislabel JPEGs as PNGs and vice
 * versa). Magic-byte detection avoids "Incomplete or corrupt PNG file" errors
 * caused by a JPEG being passed as image/png.
 */
function detectImageFormat(buf: Buffer): "png" | "jpeg" | null {
  if (buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return "png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "jpeg";
  }
  return null;
}

/**
 * Fetch a single cover photo from the ATOM backend and return it as a
 * data URL embeddable directly in <Image src>. Returns null on any error
 * so the PDF page can render a "No photo available" placeholder.
 */
async function resolveCoverPhoto(
  proxyUrl: string,
): Promise<string | null> {
  const parsed = parseProxyUrl(proxyUrl);
  if (!parsed) return null;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), PHOTO_TIMEOUT_MS);
  try {
    const res = await fetch(`${ATOM_API_BASE_URL}/api/infos/resource`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: parsed.id, uri: parsed.uri }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const format = detectImageFormat(buffer);
    if (!format) {
      console.warn(
        `[pdf-export] unsupported image format for ${parsed.id} (first bytes: ${buffer.slice(0, 4).toString("hex")})`,
      );
      return null;
    }
    return `data:image/${format};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: Request): Promise<Response> {
  let body: { benches?: LabTestMean[]; filtersDescription?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { benches, filtersDescription } = body;
  if (!Array.isArray(benches) || benches.length === 0) {
    return new Response("benches array is required", { status: 400 });
  }
  if (benches.length > MAX_BENCHES) {
    return new Response(
      `Too many benches (${benches.length}). Apply filters to reduce below ${MAX_BENCHES}.`,
      { status: 413 },
    );
  }

  const resolved: ResolvedBench[] = await Promise.all(
    benches.map(async (b) => ({
      ...b,
      resolvedCover: await resolveCoverPhoto(b.coverPhoto),
    })),
  );

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

  const buffer = await renderToBuffer(
    CatalogueExport({
      benches: resolved,
      filtersDescription:
        filtersDescription ?? "All benches (no filters applied)",
      baseUrl,
    }),
  );

  const filename = `ltm-export-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
