export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import LabTestMeanHeader from "@/components/LabTestMeanHeader";
import Gallery from "@/components/Gallery";
import { getLabTestMean, getLabTestMeans } from "@/lib/labtestmeans";
import type { LabTestMean } from "@/lib/types";

export async function generateStaticParams() {
  try {
    const all = await getLabTestMeans();
    return all.map((m) => ({ id: m.id }));
  } catch {
    return [];
  }
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-[0.15em] font-mono text-muted">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

function YesNo({ value }: { value: boolean | null }) {
  if (value == null)
    return <span className="text-muted italic">Unknown</span>;
  return (
    <span
      className={
        value
          ? "text-success font-semibold"
          : "text-muted"
      }
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

function LifecycleTimeline({
  lifecycle,
}: {
  lifecycle: LabTestMean["lifecycle"];
}) {
  const steps: { label: string; date?: string }[] = [
    { label: "Kickoff", date: lifecycle.kickoff },
    { label: "In service", date: lifecycle.inService },
    { label: "Mothballed", date: lifecycle.mothballed },
    { label: "Dismantled", date: lifecycle.dismantled },
  ].filter((s) => !!s.date) as { label: string; date: string }[];
  if (steps.length === 0)
    return <div className="text-sm text-muted">No lifecycle data.</div>;
  return (
    <ul className="space-y-2">
      {steps.map((s) => (
        <li key={s.label} className="flex items-baseline gap-3 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          <span className="text-muted w-28">{s.label}</span>
          <span className="font-mono">{s.date}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function LabTestMeanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await getLabTestMean(id);
  if (!m) notFound();

  return (
    <main className="px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <Link
        href="/"
        className="inline-block text-xs font-mono text-muted hover:text-fg mb-6"
      >
        ← Back to catalog
      </Link>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 mb-12">
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
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
        <Section title="Security & access">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {m.security.ecLevel != null && (
              <>
                <dt className="text-muted">EC level</dt>
                <dd className="font-mono">{m.security.ecLevel}</dd>
              </>
            )}
            {m.security.networkSegregated != null && (
              <>
                <dt className="text-muted">Network segregated</dt>
                <dd>
                  <YesNo value={m.security.networkSegregated} />
                </dd>
              </>
            )}
            {m.security.accesscontrol != null && (
              <>
                <dt className="text-muted">Access control</dt>
                <dd>
                  <YesNo value={m.security.accesscontrol} />
                </dd>
              </>
            )}
            {m.security.accesbadge != null && (
              <>
                <dt className="text-muted">Access badge</dt>
                <dd className="font-mono">{m.security.accesbadge}</dd>
              </>
            )}
          </dl>
          {m.security.accreditation.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-muted mb-1.5">Accreditations</div>
              <div className="flex flex-wrap gap-1.5">
                {m.security.accreditation.map((a) => (
                  <span
                    key={a}
                    className="px-2 py-0.5 rounded text-xs font-mono bg-surface-2 text-fg"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Lifecycle">
          <LifecycleTimeline lifecycle={m.lifecycle} />
        </Section>

        <Section title="Programs · Projects">
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-xs text-muted w-20">Programs</span>
              <div className="flex flex-wrap gap-1.5">
                {m.programs.length === 0 && (
                  <span className="text-sm text-muted">None</span>
                )}
                {m.programs.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded text-xs font-mono bg-accent/15 text-accent"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-xs text-muted w-20">Projects</span>
              <div className="flex flex-wrap gap-1.5">
                {m.projects.length === 0 && (
                  <span className="text-sm text-muted">None</span>
                )}
                {m.projects.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded text-xs bg-surface-2 text-fg"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
