"use client";

import { useMemo, useState } from "react";
import LabTestMeanCard from "@/components/LabTestMeanCard";
import FilterBar, { type FilterValue } from "@/components/FilterBar";
import FilterSheet from "@/components/FilterSheet";
import Pagination from "@/components/Pagination";
import { filterLabTestMeans } from "@/lib/labtestmeans";
import { usePageQuery } from "@/lib/usePageQuery";
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
};

export default function CatalogueClient({
  labTestMeans,
  types,
  statuses,
  countries,
  programs,
  complexities,
}: Props) {
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    types: [],
    statuses: [],
    countries: [],
    programs: [],
    complexities: [],
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
              value={filters}
              onChange={handleFiltersChange}
            />
            <div className="mt-4 text-xs text-muted font-mono">
              {visible.length} / {labTestMeans.length} lab test means
            </div>
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
        value={filters}
        onChange={handleFiltersChange}
        count={visible.length}
      />
    </main>
  );
}
