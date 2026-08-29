"use client";

import { useMemo, useState } from "react";
import FilterBar, { type FilterValue } from "@/components/FilterBar";
import FilterSheet from "@/components/FilterSheet";
import CircularGraph, {
  RADAR_DEFAULT_RADIUS,
  RADAR_MAX_RADIUS,
  RADAR_MIN_RADIUS,
} from "@/components/radar/CircularGraph";
import TooDenseMessage from "@/components/radar/TooDenseMessage";
import RadarSettingsControl from "@/components/radar/RadarSettingsControl";
import RadarLegend from "@/components/radar/RadarLegend";
import { filterLabTestMeans } from "@/lib/labtestmeans";
import { expandSelection } from "@/lib/aircraftStructure";
import { useLabTestMeans } from "@/lib/useLabTestMeans";
import { useRadarDisplaySettings } from "@/lib/radarDisplaySettings";

function RadarSkeleton() {
  return (
    <div className="relative h-[calc(100vh-57px)] bg-surface-2 skeleton-pulse flex items-center justify-center">
      <span className="text-sm text-muted font-mono">Loading radar…</span>
    </div>
  );
}

export default function RadarClient() {
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
  if (loading) return <RadarSkeleton />;

  return (
    <RadarLoaded
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

function RadarLoaded({
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
  // Independent from the catalogue's shared filter store (unlike `/`, like
  // `/map`) — filtering here shouldn't silently change what the catalogue
  // shows on return, and vice versa.
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    photo: "all",
    qualitySeal: "all",
    types: [],
    statuses: [],
    countries: [],
    programNodeIds: [],
    complexities: [],
    portfolios: [],
  });
  const [radius, setRadius] = useState(RADAR_DEFAULT_RADIUS);
  const { densityLimit } = useRadarDisplaySettings();

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
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex items-center gap-4 border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold">Radar</h1>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Preview
        </span>
        <span className="text-xs text-muted">
          {visible.length} of {labTestMeans.length} lab test means shown
        </span>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="radar-size" className="text-xs text-muted">
            Circle size
          </label>
          <input
            id="radar-size"
            type="range"
            min={RADAR_MIN_RADIUS}
            max={RADAR_MAX_RADIUS}
            step={10}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-40 accent-accent"
          />
          <RadarSettingsControl />
        </div>
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden">
        {visible.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-5 py-3 rounded-card bg-surface/90 border border-border text-sm text-muted backdrop-blur-md pointer-events-auto">
              No lab test means match these filters.
            </div>
          </div>
        )}
        {visible.length > 0 && visible.length <= densityLimit && (
          <>
            <CircularGraph benches={visible} radius={radius} />
            <RadarLegend />
          </>
        )}
        {visible.length > densityLimit && (
          <TooDenseMessage count={visible.length} limit={densityLimit} />
        )}

        <div className="absolute top-4 left-4 w-[340px] max-h-[calc(100%-2rem)] glass-panel p-5 overflow-y-auto z-10 hidden lg:block">
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
    </div>
  );
}
