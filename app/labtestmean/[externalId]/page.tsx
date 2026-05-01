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
import SecuritySection from "@/components/detail/SecuritySection";
import LifecycleSection from "@/components/detail/LifecycleSection";
import ProjectsSection from "@/components/detail/ProjectsSection";
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
        <SecuritySection security={m.security} />
        <LifecycleSection lifecycle={m.lifecycle} />
        <ProjectsSection projects={m.projects} />
      </div>
    </main>
  );
}
