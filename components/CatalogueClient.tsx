"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LabTestMeanCard from "@/components/LabTestMeanCard";
import FilterBar, { type FilterValue } from "@/components/FilterBar";
import FilterSheet from "@/components/FilterSheet";
import Pagination from "@/components/Pagination";
import { filterLabTestMeans } from "@/lib/labtestmeans";
import type {
  Complexity,
  LabTestMean,
  LabTestMeanStatus,
  LabTestMeanType,
} from "@/lib/types";

const PAGE_SIZE = 6;

function parsePage(raw: string | null): number {
  if (!raw) return 1;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

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
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

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
  const urlPage = parsePage(searchParams.get("page"));
  const safePage = Math.min(urlPage, totalPages);
  const paged = visible.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const setPageInUrl = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) params.delete("page");
    else params.set("page", String(newPage));
    const qs = params.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    const currentQs = searchParams.toString();
    const current = currentQs ? `${pathname}?${currentQs}` : pathname;
    if (target !== current) {
      router.replace(target, { scroll: false });
    }
  };

  useEffect(() => {
    const raw = searchParams.get("page");
    if (urlPage > totalPages) {
      setPageInUrl(1);
    } else if (raw !== null && parsePage(raw) === 1) {
      setPageInUrl(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPage, totalPages, searchParams]);

  const handleFiltersChange = (v: FilterValue) => {
    setFilters(v);
    setPageInUrl(1);
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
            page={safePage}
            totalPages={totalPages}
            pageSize={PAGE_SIZE}
            totalItems={visible.length}
            onPageChange={setPageInUrl}
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
