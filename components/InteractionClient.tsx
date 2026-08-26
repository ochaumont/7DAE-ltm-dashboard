"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useLabTestMeans } from "@/lib/useLabTestMeans";
import BenchCombobox from "@/components/interaction/BenchCombobox";
import InteractionEmptyState from "@/components/interaction/InteractionEmptyState";

const DependencyGraph = dynamic(
  () => import("@/components/interaction/DependencyGraph"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-surface-2 skeleton-pulse" />
    ),
  },
);

function InteractionSkeleton() {
  return (
    <div className="h-[calc(100vh-57px)] bg-surface-2 skeleton-pulse flex items-center justify-center">
      <span className="text-sm text-muted font-mono">Loading benches…</span>
    </div>
  );
}

export default function InteractionClient() {
  const { labTestMeans, loading, error } = useLabTestMeans();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedExternalId = searchParams.get("id") ?? null;

  if (error) throw error;
  if (loading) return <InteractionSkeleton />;

  // Guard `selectedExternalId` explicitly: without it, `m.externalId ===
  // null` would auto-match any bench whose externalId is null/missing (a
  // real backend data-quality issue, cf. BenchCombobox) whenever the page is
  // opened with no `?id=` in the URL at all.
  const selected = selectedExternalId
    ? labTestMeans.find((m) => m.externalId === selectedExternalId) ?? null
    : null;

  function handleChange(m: (typeof labTestMeans)[number] | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (m) params.set("id", m.externalId);
    else params.delete("id");
    router.replace(`/interaction?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="border-b border-border p-4">
        <BenchCombobox
          options={labTestMeans}
          value={selected}
          onChange={handleChange}
        />
      </div>
      <div className="relative flex-1">
        {selected ? (
          <DependencyGraph
            bench={selected}
            allBenches={labTestMeans}
            onRequestBench={handleChange}
          />
        ) : (
          <InteractionEmptyState reason="no-selection" />
        )}
      </div>
    </div>
  );
}
