export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import LabTestMeanHeader from "@/components/LabTestMeanHeader";
import Gallery from "@/components/Gallery";
import Section from "@/components/detail/Section";
import { getLabTestMeans } from "@/lib/labtestmeans";

export default async function LabTestMeanDetailPage({
  params,
}: {
  params: Promise<{ externalId: string }>;
}) {
  const { externalId } = await params;

  let all;
  try {
    all = await getLabTestMeans();
  } catch {
    notFound();
  }

  const m = all.find((ltm) => ltm.externalId === externalId) ?? null;
  if (!m) notFound();

  const idToExternalId = new Map(
    all
      .filter((ltm) => ltm.externalId)
      .map((ltm) => [ltm.id, ltm.externalId]),
  );

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
              <div className="flex flex-wrap gap-2 max-w-detail-info">
                {m.softwares.map((s) => (
                  <a
                    key={s.id}
                    href={`https://airbus.leanix.net/airbuslive/factsheet/Application/${s.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-sm bg-surface-2 text-fg/90 border border-border hover:bg-accent/10 hover:text-accent hover:border-accent/20 transition-colors"
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            </Section>
          )}
          {m.dependsOn.length > 0 && (
            <Section title="Depends on">
              <div className="flex flex-wrap gap-2 max-w-detail-info">
                {m.dependsOn.map((dep) => {
                  const xid = idToExternalId.get(dep.id);
                  return xid ? (
                    <Link
                      key={dep.id}
                      href={`/labtestmean/${encodeURIComponent(xid)}`}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-sm bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors"
                    >
                      {dep.name}
                    </Link>
                  ) : (
                    <span
                      key={dep.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-sm bg-surface-2 text-muted border border-border"
                      title="lab test mean introuvable"
                    >
                      {dep.name}
                    </span>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}
