// Backend ATOM dev is flaky — SSG-prerendering 314 detail pages would fail the
// build whenever a single fetch times out. Force dynamic + per-fetch
// `revalidate: 60` gives effectively the same UX with build resilience.
// Switch back when the backend is reliable enough for build-time SSG.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import LabTestMeanHeader from "@/components/LabTestMeanHeader";
import Gallery from "@/components/Gallery";
import Section from "@/components/detail/Section";
import {
  getLabTestMeanByExternalId,
  getLabTestMeans,
} from "@/lib/labtestmeans";

export async function generateStaticParams() {
  try {
    const all = await getLabTestMeans();
    return all
      .filter((m) => typeof m.externalId === "string" && m.externalId.length > 0)
      .map((m) => ({ externalId: m.externalId }));
  } catch {
    return [];
  }
}

export default async function LabTestMeanDetailPage({
  params,
}: {
  params: Promise<{ externalId: string }>;
}) {
  const { externalId } = await params;
  const m = await getLabTestMeanByExternalId(externalId);
  if (!m) notFound();

  // Build id → externalId map so dependsOn entries can become real <Link>s.
  // `getLabTestMeans` is React-cached per request, so this is essentially free
  // when the dashboard is also rendering the catalogue. Failure → empty map,
  // dependencies render as plain names.
  const idToExternalId = new Map<string, string>();
  try {
    for (const ltm of await getLabTestMeans()) {
      if (ltm.externalId) idToExternalId.set(ltm.id, ltm.externalId);
    }
  } catch {}

  return (
    <main className="px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <Link
        href="/"
        className="inline-block text-xs font-mono text-muted hover:text-fg mb-6"
      >
        ← Back to catalog
      </Link>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
        <Gallery photos={m.photos} />
        <div className="space-y-6">
          <LabTestMeanHeader labTestMean={m} />
          {m.description && (
            <Section title="Description">
              <p className="text-base leading-relaxed text-fg/90 max-w-detail-info">
                {m.description}
              </p>
            </Section>
          )}
          {m.instrumentation && (
            <Section title="Instrumentation">
              <p className="text-base leading-relaxed text-fg/90 max-w-detail-info">
                {m.instrumentation}
              </p>
            </Section>
          )}
          {m.softwares.length > 0 && (
            <Section title="Software">
              <p className="text-base leading-relaxed text-fg/90 max-w-detail-info">
                {m.softwares.join(" · ")}
              </p>
            </Section>
          )}
          {m.dependsOn.length > 0 && (
            <Section title="Depends on">
              <p className="text-base leading-relaxed text-fg/90 max-w-detail-info">
                {m.dependsOn.map((dep, i) => {
                  const xid = idToExternalId.get(dep.id);
                  return (
                    <span key={dep.id}>
                      {i > 0 && " · "}
                      {xid ? (
                        <Link
                          href={`/labtestmean/${encodeURIComponent(xid)}`}
                          className="text-accent hover:underline"
                        >
                          {dep.name}
                        </Link>
                      ) : (
                        dep.name
                      )}
                    </span>
                  );
                })}
              </p>
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}
