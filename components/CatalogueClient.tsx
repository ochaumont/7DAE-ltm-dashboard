"use client";

import { useMemo, useState } from "react";
import LabTestMeanCard from "@/components/LabTestMeanCard";
import FilterBar, { type FilterValue } from "@/components/FilterBar";
import FilterSheet from "@/components/FilterSheet";
import Pagination from "@/components/Pagination";
import { filterLabTestMeans } from "@/lib/labtestmeans";
import { usePageQuery } from "@/lib/usePageQuery";
import { serializeFilters } from "@/lib/filterDescription";
import type {
  Complexity,
  LabTestMean,
  LabTestMeanStatus,
  LabTestMeanType,
} from "@/lib/types";

const PAGE_SIZE = 6;

type Props = {
  labTestMeans: LabTestMean[];
  types: LabTestMeanType[];
  statuses: LabTestMeanStatus[];
  countries: string[];
  programs: string[];
  complexities: Complexity[];
  portfolios: string[];
};

export default function CatalogueClient({
  labTestMeans,
  types,
  statuses,
  countries,
  programs,
  complexities,
  portfolios,
}: Props) {
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    types: [],
    statuses: [],
    countries: [],
    programs: [],
    complexities: [],
    portfolios: [],
  });

  const visible = useMemo(
    () => filterLabTestMeans(labTestMeans, filters),
    [labTestMeans, filters],
  );
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const { page, setPage } = usePageQuery(totalPages);
  const paged = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFiltersChange = (v: FilterValue) => {
    setFilters(v);
    setPage(1);
  };

  const [isExporting, setIsExporting] = useState(false);

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
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benches: visible,
          filtersDescription: serializeFilters(filters),
        }),
      });
      if (!res.ok) {
        throw new Error((await res.text()) || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
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
    <main className="px-4 md:px-6 py-8 max-w-[1600px] mx-auto">
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-[80px]">
            <FilterBar
              types={types}
              statuses={statuses}
              countries={countries}
              programs={programs}
              complexities={complexities}
              portfolios={portfolios}
              value={filters}
              onChange={handleFiltersChange}
            />
            <div className="mt-4 text-xs text-muted font-mono">
              {visible.length} / {labTestMeans.length} lab test means
            </div>
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
        programs={programs}
        complexities={complexities}
        portfolios={portfolios}
        value={filters}
        onChange={handleFiltersChange}
        count={visible.length}
      />
    </main>
  );
}
