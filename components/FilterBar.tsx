"use client";

import { useMemo, useState } from "react";
import type {
  AircraftStructureNode,
  LabTestMeanStatus,
  LabTestMeanType,
} from "@/lib/types";
import { COMPLEXITY_NA, PORTFOLIO_NONE } from "@/lib/labtestmeans";
import TreeFilter from "@/components/TreeFilter";
import clsx from "clsx";

const STATUS_LABELS: Record<LabTestMeanStatus, string> = {
  operational: "Operational",
  mothballed: "Mothballed",
  "out-of-service": "Out of Service",
  "in-project": "In Project",
};

const STATUS_ORDER: LabTestMeanStatus[] = [
  "in-project",
  "operational",
  "mothballed",
  "out-of-service",
];

const TYPE_LABELS: Record<LabTestMeanType, string> = {
  SIB: "SIB",
  SIMU: "SIMU",
  FIB: "FIB",
  RT: "Mean ResearchOnTest",
  NA: "NA",
};

export type FilterValue = {
  search: string;
  types: LabTestMeanType[];
  statuses: LabTestMeanStatus[];
  countries: string[];
  programNodeIds: string[];
  complexities: string[];
  portfolios: string[];
};

type Props = {
  types: LabTestMeanType[];
  statuses: LabTestMeanStatus[];
  countries: string[];
  tree: AircraftStructureNode[];
  programCounts: Map<string, number>;
  hasUnassignedPrograms: boolean;
  complexities: string[];
  portfolios: string[];
  value: FilterValue;
  onChange: (v: FilterValue) => void;
};

function Toggle<T extends string>({
  options,
  value,
  onChange,
  renderLabel,
  cols,
}: {
  options: T[];
  value: T[];
  onChange: (v: T[]) => void;
  renderLabel?: (o: T) => string;
  cols?: number;
}) {
  const containerClass = cols ? "grid gap-1" : "flex flex-wrap gap-1";
  const containerStyle = cols
    ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
    : undefined;
  return (
    <div className={containerClass} style={containerStyle}>
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() =>
              onChange(active ? value.filter((v) => v !== o) : [...value, o])
            }
            className={clsx(
              "px-2.5 py-1 rounded text-xs font-medium border transition-colors truncate",
              active
                ? "bg-accent text-accent-fg border-accent"
                : "bg-surface text-fg border-border hover:border-accent/50"
            )}
          >
            {renderLabel ? renderLabel(o) : o}
          </button>
        );
      })}
    </div>
  );
}

export default function FilterBar({
  types,
  statuses,
  countries,
  tree,
  programCounts,
  hasUnassignedPrograms,
  complexities,
  portfolios,
  value,
  onChange,
}: Props) {
  const [search, setSearch] = useState(value.search);
  const sortedTypes = useMemo(
    () => types.filter((t) => t !== "NA"),
    [types],
  );
  const sortedCountries = useMemo(
    () => countries.filter((c) => c !== "Unknown"),
    [countries],
  );
  const sortedComplexities = useMemo(
    () => complexities.filter((c) => c !== COMPLEXITY_NA),
    [complexities],
  );
  const sortedStatuses = useMemo(
    () =>
      [...statuses].sort(
        (a, b) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b),
      ),
    [statuses],
  );
  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search lab test means, references, managers…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange({ ...value, search: e.target.value });
        }}
        className="w-full px-3 py-2 rounded bg-surface border border-border text-fg placeholder:text-muted focus:outline-none focus:border-accent"
      />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Type</div>
        <Toggle
          options={sortedTypes}
          value={value.types}
          onChange={(v) => onChange({ ...value, types: v })}
          renderLabel={(t) => TYPE_LABELS[t]}
          cols={sortedTypes.length || 1}
        />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Status</div>
        <Toggle
          options={sortedStatuses}
          value={value.statuses}
          onChange={(v) => onChange({ ...value, statuses: v })}
          renderLabel={(s) => STATUS_LABELS[s]}
          cols={2}
        />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Country</div>
        <Toggle
          options={sortedCountries}
          value={value.countries}
          onChange={(v) => onChange({ ...value, countries: v })}
          cols={2}
        />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Portfolio</div>
        <Toggle
          options={portfolios}
          value={value.portfolios}
          onChange={(v) => onChange({ ...value, portfolios: v })}
          renderLabel={(p) => (p === PORTFOLIO_NONE ? "None" : p)}
          cols={2}
        />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Complexity</div>
        <Toggle
          options={sortedComplexities}
          value={value.complexities}
          onChange={(v) => onChange({ ...value, complexities: v })}
          renderLabel={(c) => c.charAt(0).toUpperCase() + c.slice(1)}
          cols={sortedComplexities.length || 1}
        />
      </div>
      {(tree.length > 0 || hasUnassignedPrograms) && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Aircraft programs</div>
          <TreeFilter
            tree={tree}
            hasUnassigned={hasUnassignedPrograms}
            selectedIds={value.programNodeIds}
            counts={programCounts}
            onChange={(v) => onChange({ ...value, programNodeIds: v })}
          />
        </div>
      )}
    </div>
  );
}
