"use client";

import { useEffect, useMemo, useState } from "react";
import { useSWRConfig, unstable_serialize } from "swr";
import LabTestMeanCard from "@/components/LabTestMeanCard";
import FilterBar, { type FilterValue } from "@/components/FilterBar";
import FilterSheet from "@/components/FilterSheet";
import Pagination from "@/components/Pagination";
import { filterLabTestMeans } from "@/lib/labtestmeans";
import { expandSelection } from "@/lib/aircraftStructure";
import { useLabTestMeans } from "@/lib/useLabTestMeans";
import { usePageQuery } from "@/lib/usePageQuery";
import {
  useCatalogueFilters,
  setCatalogueFilters,
  setCataloguePage,
} from "@/lib/catalogueFilters";
import { serializeFilters } from "@/lib/filterDescription";
import { NEXT_PUBLIC_ATOM_API_BASE_URL } from "@/lib/atom-api";
import { photoKey, type CachedPhoto } from "@/lib/usePhoto";
import type { CoverPhoto } from "@/lib/types";

const PAGE_SIZE = 6;

function CatalogueSkeleton() {
  return (
    <main className="px-4 md:px-6 py-8 max-w-[1600px]">
      <div className="grid lg:grid-cols-[296px_1fr] gap-6">
        <aside className="hidden lg:block">
          <div className="h-[400px] rounded-card bg-surface-2 skeleton-pulse" />
        </aside>
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-card overflow-hidden">
                <div className="aspect-[4/3] bg-surface-2 skeleton-pulse" />
                <div className="px-4 pt-4 pb-3 space-y-2">
                  <div className="h-4 w-24 rounded bg-surface-2 skeleton-pulse" />
                  <div className="h-5 w-3/4 rounded bg-surface-2 skeleton-pulse" />
                  <div className="h-4 w-1/2 rounded bg-surface-2 skeleton-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CatalogueClient() {
  const {
    labTestMeans,
    tree,
    programCounts,
    hasUnassignedPrograms,
    types,
    statuses,
    countries,
    complexities,
    portfolios,
    loading,
    error,
  } = useLabTestMeans();

  if (error) throw error;
  if (loading) return <CatalogueSkeleton />;

  return (
    <CatalogueLoaded
      labTestMeans={labTestMeans}
      tree={tree}
      programCounts={programCounts}
      hasUnassignedPrograms={hasUnassignedPrograms}
      types={types}
      statuses={statuses}
      countries={countries}
      complexities={complexities}
      portfolios={portfolios}
    />
  );
}

type LoadedProps = {
  labTestMeans: ReturnType<typeof useLabTestMeans>["labTestMeans"];
  tree: ReturnType<typeof useLabTestMeans>["tree"];
  programCounts: ReturnType<typeof useLabTestMeans>["programCounts"];
  hasUnassignedPrograms: boolean;
  types: ReturnType<typeof useLabTestMeans>["types"];
  statuses: ReturnType<typeof useLabTestMeans>["statuses"];
  countries: ReturnType<typeof useLabTestMeans>["countries"];
  complexities: ReturnType<typeof useLabTestMeans>["complexities"];
  portfolios: ReturnType<typeof useLabTestMeans>["portfolios"];
};

function CatalogueLoaded({
  labTestMeans,
  tree,
  programCounts,
  hasUnassignedPrograms,
  types,
  statuses,
  countries,
  complexities,
  portfolios,
}: LoadedProps) {
  // Filters live in an in-memory store (see lib/catalogueFilters) so they
  // survive catalogue → detail → catalogue ("Back to catalog") and can be reset
  // by the "Catalogue" menu, while being lost on reload.
  const { filters } = useCatalogueFilters();

  const visible = useMemo(() => {
    const { names, includeUnassigned } = expandSelection(
      tree,
      filters.programNodeIds,
    );
    return filterLabTestMeans(labTestMeans, {
      ...filters,
      programNodeNames: names,
      includeUnassignedPrograms: includeUnassigned,
    });
  }, [labTestMeans, tree, filters]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const { page, setPage } = usePageQuery(totalPages);
  const paged = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Mirror the (URL-driven, clamped) page into the store so the detail page's
  // "Back to catalog" link can restore it via ?page=N.
  useEffect(() => {
    setCataloguePage(page);
  }, [page]);

  const handleFiltersChange = (v: FilterValue) => {
    setCatalogueFilters(v);
    setPage(1);
  };

  const [isExporting, setIsExporting] = useState(false);
  const { cache } = useSWRConfig();

  const blobToDataUrl = async (blob: Blob): Promise<string | null> => {
    const buf = new Uint8Array(await blob.arrayBuffer());
    const fmt = buf[0] === 0x89 ? "png" : buf[0] === 0xff ? "jpeg" : null;
    if (!fmt) return null;
    const binary = Array.from(buf).map((b) => String.fromCharCode(b)).join("");
    return `data:image/${fmt};base64,${btoa(binary)}`;
  };

  const fetchPhotoDataUrl = async (cover: CoverPhoto): Promise<string | null> => {
    // Reuse the Blob already cached by `usePhoto` if this cover was displayed
    // (same SWR key) — no extra POST for already-shown covers.
    const cached = cache.get(unstable_serialize(photoKey(cover.id)))?.data as
      | CachedPhoto
      | undefined;
    if (cached?.blob) return blobToDataUrl(cached.blob);
    try {
      const res = await fetch(`${NEXT_PUBLIC_ATOM_API_BASE_URL}/api/infos/resource`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cover.id, uri: cover.uri }),
      });
      if (!res.ok) return null;
      return blobToDataUrl(await res.blob());
    } catch {
      return null;
    }
  };

  const handleExportPdf = async () => {
    if (visible.length === 0 || isExporting) return;
    if (
      visible.length === labTestMeans.length &&
      !window.confirm(`Export all ${visible.length} benches as PDF?`)
    ) {
      return;
    }
    setIsExporting(true);
    try {
      const resolved = await Promise.all(
        visible.map(async (b) => ({
          ...b,
          resolvedCover: b.coverPhoto ? await fetchPhotoDataUrl(b.coverPhoto) : null,
        })),
      );
      const { pdf } = await import("@react-pdf/renderer");
      const CatalogueExport = (await import("@/components/pdf/CatalogueExport")).default;
      const blob = await pdf(
        CatalogueExport({
          benches: resolved,
          filtersDescription: serializeFilters(filters, tree),
          baseUrl: window.location.origin,
        }),
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ltm-export-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="px-4 md:px-6 py-8 max-w-[1600px]">
      <div className="grid lg:grid-cols-[296px_1fr] gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-[80px] max-h-[calc(100vh-100px)] overflow-y-auto glass-panel p-5">
            <div className="mb-3 text-xs text-muted font-mono">
              {visible.length} / {labTestMeans.length} lab test means
            </div>
            <FilterBar
              types={types}
              statuses={statuses}
              countries={countries}
              tree={tree}
              programCounts={programCounts}
              hasUnassignedPrograms={hasUnassignedPrograms}
              complexities={complexities}
              portfolios={portfolios}
              value={filters}
              onChange={handleFiltersChange}
            />
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={visible.length === 0 || isExporting}
              className="mt-3 w-full text-xs font-mono px-3 py-2 rounded border border-border bg-surface hover:bg-accent/10 hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? "Generating PDF…" : `Export PDF (${visible.length})`}
            </button>
          </div>
        </aside>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {paged.map((m) => (
              <LabTestMeanCard key={m.id} labTestMean={m} />
            ))}
          </div>
          {visible.length === 0 && (
            <div className="py-20 text-center text-muted">
              No lab test mean matches these filters.
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={PAGE_SIZE}
            totalItems={visible.length}
            onPageChange={setPage}
          />
        </section>
      </div>

      <FilterSheet
        types={types}
        statuses={statuses}
        countries={countries}
        tree={tree}
        programCounts={programCounts}
        hasUnassignedPrograms={hasUnassignedPrograms}
        complexities={complexities}
        portfolios={portfolios}
        value={filters}
        onChange={handleFiltersChange}
        count={visible.length}
      />
    </main>
  );
}
