import LabTestMeanDetailClient from "@/components/LabTestMeanDetailClient";

export const dynamicParams = false;

// We do NOT pre-generate one page per lab test mean.
//
// - Production (output: export): return a single placeholder route. The static
//   export emits exactly ONE shell (`/labtestmean/_.html`); nginx serves it for
//   every `/labtestmean/*` URL (see the location rule in nginx-custom.conf).
//   No per-id page is built ahead of time — the shell fetches its data in the
//   browser at view time.
// - Development: the Next dev server refuses any route not listed here
//   (dynamicParams=false). Nothing is generated ahead of time — pages are
//   rendered on demand — but we must enumerate the valid ids so the dev server
//   lets the requests through. This runs server-side, so it uses an absolute
//   backend URL (the relative browser proxy path only works in the browser).
export async function generateStaticParams() {
  if (process.env.NODE_ENV === "production") {
    return [{ externalId: "_" }];
  }
  const base =
    process.env.ATOM_API_PROXY_TARGET ||
    "http://localhost:8080/atom-synchronizer-dev";
  try {
    const res = await fetch(`${base}/api/infos/labtestmeans`);
    if (res.ok) {
      const list = (await res.json()) as Array<{ externalId?: string }>;
      const params = list
        .filter((m) => typeof m.externalId === "string" && m.externalId.length > 0)
        .map((m) => ({ externalId: m.externalId as string }));
      if (params.length > 0) return params;
    }
  } catch {
    // Backend unreachable — fall through to the placeholder.
  }
  return [{ externalId: "_" }];
}

export default function LabTestMeanDetailPage() {
  return <LabTestMeanDetailClient />;
}
