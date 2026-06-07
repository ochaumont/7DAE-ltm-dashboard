"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import FilterBar, { type FilterValue } from "@/components/FilterBar";
import FilterSheet from "@/components/FilterSheet";
import { filterLabTestMeans } from "@/lib/labtestmeans";
import { expandSelection } from "@/lib/aircraftStructure";
import { useLabTestMeans } from "@/lib/useLabTestMeans";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

function MapSkeleton() {
  return (
    <div className="relative h-[calc(100vh-57px)] bg-surface-2 skeleton-pulse flex items-center justify-center">
      <span className="text-sm text-muted font-mono">Loading map…</span>
    </div>
  );
}

export default function MapClient() {
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
  if (loading) return <MapSkeleton />;

  return (
    <MapLoaded
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

function MapLoaded({
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
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    types: [],
    statuses: [],
    countries: [],
    programNodeIds: [],
    complexities: [],
    portfolios: [],
  });

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

  return (
    <div className="relative h-[calc(100vh-57px)]">
      <div className="absolute inset-0">
        <MapView labTestMeans={visible} />
      </div>
      {visible.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-5 py-3 rounded-card bg-surface/90 border border-border text-sm text-muted backdrop-blur-md pointer-events-auto">
            No lab test means match these filters.
          </div>
        </div>
      )}
      <div className="absolute top-4 left-4 w-[340px] max-h-[calc(100vh-100px)] glass-panel p-5 overflow-y-auto z-10 hidden lg:block">
        <h2 className="text-lg font-bold mb-1">Lab test means by location</h2>
        <p className="text-xs text-muted mb-4">
          {visible.length} of {labTestMeans.length} shown on map
        </p>
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
          onChange={setFilters}
        />
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
        onChange={setFilters}
        count={visible.length}
      />
    </div>
  );
}
