"use client";

import { useMemo } from "react";
import { useSearchParams, notFound } from "next/navigation";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import LabTestMeanHeader from "@/components/LabTestMeanHeader";
import Gallery from "@/components/Gallery";
import Section from "@/components/detail/Section";
import { getLabTestMeans, getLabTestMeanByExternalId } from "@/lib/labtestmeans";
import { SWR_KEY_LTM } from "@/lib/useLabTestMeans";
import type { LabTestMean } from "@/lib/types";

function DetailSkeleton() {
  return (
    <main className="px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <div className="h-4 w-24 rounded bg-surface-2 skeleton-pulse mb-6" />
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
        <div className="aspect-[4/3] rounded-card bg-surface-2 skeleton-pulse" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-surface-2 skeleton-pulse" />
          <div className="h-4 w-1/2 rounded bg-surface-2 skeleton-pulse" />
          <div className="h-4 w-2/3 rounded bg-surface-2 skeleton-pulse" />
        </div>
      </div>
    </main>
  );
}

export default function LabTestMeanDetailClient() {
  const searchParams = useSearchParams();
  const externalId = searchParams.get("id") ?? "";
  const { cache } = useSWRConfig();

  // Cache-first: if the catalogue/map already loaded the list, serve the item
  // from memory (no network). `fallbackData` makes SWR skip the fetch entirely.
  const cachedList = cache.get(SWR_KEY_LTM)?.data as LabTestMean[] | undefined;
  const fallbackData = cachedList?.find((m) => m.externalId === externalId);

  const { data: ltm, error } = useSWR(
    externalId ? ["ltm", externalId] : null,
    () => getLabTestMeanByExternalId(externalId),
    { fallbackData },
  );

  // Cold access (direct URL) with dependencies → load the full list in the
  // background ONLY to resolve "depends on" links (id → externalId). The fiche
  // itself is already shown from the single-item endpoint.
  const needList = !!ltm && ltm.dependsOn.length > 0 && !cachedList;
  const { data: bgList } = useSWR(needList ? SWR_KEY_LTM : null, getLabTestMeans);

  const idToExternalId = useMemo(() => {
    const src = cachedList ?? bgList ?? [];
    return new Map(
      src
        .filter((m) => m.externalId)
        .map((m) => [m.id, m.externalId] as const),
    );
  }, [cachedList, bgList]);

  if (error) throw error;
  if (!externalId) return notFound();
  if (ltm === undefined) return <DetailSkeleton />;
  if (ltm === null) return notFound();

  return (
    <main className="px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <Link
        href="/"
        className="inline-block text-xs font-mono text-muted hover:text-fg mb-6"
      >
        ← Back to catalog
      </Link>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
        <Gallery photos={ltm.photos} />
        <div className="space-y-6">
          <LabTestMeanHeader labTestMean={ltm} />
          {ltm.description && (
            <Section title="Description">
              <p className="text-base leading-relaxed text-fg/90 max-w-detail-info">
                {ltm.description}
              </p>
            </Section>
          )}
          {ltm.instrumentation && (
            <Section title="Instrumentation">
              <p className="text-base leading-relaxed text-fg/90 max-w-detail-info">
                {ltm.instrumentation}
              </p>
            </Section>
          )}
          {ltm.softwares.length > 0 && (
            <Section title="Software">
              <div className="flex flex-wrap gap-2 max-w-detail-info">
                {ltm.softwares.map((s) => (
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
          {ltm.dependsOn.length > 0 && (
            <Section title="Depends on">
              <div className="flex flex-wrap gap-2 max-w-detail-info">
                {ltm.dependsOn.map((dep) => {
                  const xid = idToExternalId.get(dep.id);
                  return xid ? (
                    <Link
                      key={dep.id}
                      href={`/labtestmean?id=${encodeURIComponent(xid)}`}
                      // Same static page as every other detail link → no prefetch
                      // (avoids redundant fetches and gateway 301/403 noise).
                      prefetch={false}
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
