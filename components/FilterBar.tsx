"use client";

import { useMemo, useState } from "react";
import type {
  AircraftStructureNode,
  LabTestMeanStatus,
  LabTestMeanType,
  PhotoFilter,
} from "@/lib/types";
import { COMPLEXITY_NA, PORTFOLIO_NONE } from "@/lib/labtestmeans";
import { STATUS_LABELS, TYPE_LABELS } from "@/lib/labels";
import TreeFilter from "@/components/TreeFilter";
import clsx from "clsx";

const STATUS_ORDER: LabTestMeanStatus[] = [
  "in-project",
  "operational",
  "mothballed",
  "out-of-service",
];

// Type filter laid out on two rows: short labels together on row 1, the long
// ones (SIMULATOR, SHARED RESOURCE) on row 2 where they get half-width each and
// stay readable instead of being truncated.
const TYPE_ROWS: LabTestMeanType[][] = [
  ["SIB", "FIB", "RT"],
  ["SIMU", "SHARE"],
];

// Tri-state sliding switch, left → right. The knob is green for "with"/"all"
// and red for "without" (see the requested toggle.gif visual).
const PHOTO_STATES: { value: PhotoFilter; label: string; tone: "on" | "off" }[] =
  [
    { value: "with", label: "With photo", tone: "on" },
    { value: "all", label: "All", tone: "on" },
    { value: "without", label: "Without photo", tone: "off" },
  ];

export type FilterValue = {
  search: string;
  photo: PhotoFilter;
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
  optionClassName,
  cols,
}: {
  options: T[];
  value: T[];
  onChange: (v: T[]) => void;
  renderLabel?: (o: T) => string;
  optionClassName?: (o: T) => string | undefined;
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
                : "bg-surface text-fg border-border hover:border-accent/50",
              optionClassName?.(o)
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
  const photoIndex = Math.max(
    0,
    PHOTO_STATES.findIndex((s) => s.value === value.photo),
  );
  const currentPhoto = PHOTO_STATES[photoIndex];
  const typeRows = useMemo(() => {
    const present = new Set(types);
    return TYPE_ROWS.map((row) => row.filter((t) => present.has(t))).filter(
      (row) => row.length > 0,
    );
  }, [types]);
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
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Photo</div>
        <div className="flex items-center gap-2.5">
          <div
            role="radiogroup"
            aria-label="Photo filter"
            className="relative inline-flex h-[26px] w-16 shrink-0 rounded-full bg-[#00205B] p-[3px] shadow-inner"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute top-[3px] left-[3px] z-20 h-5 w-5 rounded-full shadow transition-transform duration-200 ease-out"
              style={{
                transform: `translateX(${photoIndex * 19}px)`,
                backgroundColor: "var(--color-bg)",
              }}
            />
            {PHOTO_STATES.map((s) => (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={value.photo === s.value}
                aria-label={s.label}
                title={s.label}
                onClick={() => onChange({ ...value, photo: s.value })}
                className="relative z-10 flex-1 rounded-full bg-transparent focus:outline-none"
              />
            ))}
          </div>
          <span className="text-xs font-medium text-fg">{currentPhoto.label}</span>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Type</div>
        <div className="space-y-1">
          {typeRows.map((row, i) => (
            <Toggle
              key={i}
              options={row}
              value={value.types}
              onChange={(v) => onChange({ ...value, types: v })}
              renderLabel={(t) => TYPE_LABELS[t]}
              optionClassName={(t) => (t === "SHARE" ? "!text-[10px]" : undefined)}
              cols={row.length}
            />
          ))}
        </div>
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
