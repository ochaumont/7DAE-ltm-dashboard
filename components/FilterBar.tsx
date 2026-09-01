"use client";

import { useMemo, useState } from "react";
import type {
  AircraftStructureNode,
  LabTestMeanStatus,
  LabTestMeanType,
  PhotoFilter,
  QualitySealFilter,
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

// Same tri-state sliding switch as PHOTO_STATES, ALL in the middle position.
const QUALITY_SEAL_STATES: { value: QualitySealFilter; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "all", label: "All" },
  { value: "released", label: "Released" },
];

export type FilterValue = {
  search: string;
  photo: PhotoFilter;
  qualitySeal: QualitySealFilter;
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
}: Readonly<{
  options: T[];
  value: T[];
  onChange: (v: T[]) => void;
  renderLabel?: (o: T) => string;
  optionClassName?: (o: T) => string | undefined;
  cols?: number;
}>) {
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
              "px-2 py-0.5 rounded text-[11px] font-medium border transition-colors truncate",
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

// Tri-state sliding switch shared by "Photo" and "Quality seal" — same knob
// animation and radiogroup semantics, parameterized by the states array.
function TriToggle<T extends string>({
  label,
  ariaLabel,
  states,
  value,
  onChange,
}: Readonly<{
  label: string;
  ariaLabel: string;
  states: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}>) {
  const index = Math.max(
    0,
    states.findIndex((s) => s.value === value),
  );
  const current = states[index];
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <div
          role="radiogroup"
          aria-label={ariaLabel}
          className="relative inline-flex h-[22px] w-14 shrink-0 rounded-full bg-[#00205B] p-[3px] shadow-inner"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute top-[3px] left-[3px] z-20 h-4 w-4 rounded-full shadow transition-transform duration-200 ease-out"
            style={{
              transform: `translateX(${index * 17}px)`,
              backgroundColor: "var(--color-bg)",
            }}
          />
          {states.map((s) => (
            <button // NOSONAR: custom pill toggle kept as role="radio", not native <input type="radio"> (would need a full visual rebuild), see correction-issues-sonarqube.md
              key={s.value}
              type="button"
              role="radio"
              aria-checked={value === s.value}
              aria-label={s.label}
              title={s.label}
              onClick={() => onChange(s.value)}
              className="relative z-10 flex-1 rounded-full bg-transparent focus:outline-none"
            />
          ))}
        </div>
        <span className="text-[11px] font-medium text-fg">{current.label}</span>
      </div>
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
}: Readonly<Props>) {
  const [search, setSearch] = useState(value.search);
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
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Search lab test means, references, managers…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange({ ...value, search: e.target.value });
        }}
        className="w-full px-3 py-1.5 rounded bg-surface border border-border text-sm text-fg placeholder:text-muted focus:outline-none focus:border-accent"
      />
      <div className="grid grid-cols-2 gap-3">
        <TriToggle
          label="Photo"
          ariaLabel="Photo filter"
          states={PHOTO_STATES}
          value={value.photo}
          onChange={(v) => onChange({ ...value, photo: v })}
        />
        <TriToggle
          label="Quality seal"
          ariaLabel="Quality seal filter"
          states={QUALITY_SEAL_STATES}
          value={value.qualitySeal}
          onChange={(v) => onChange({ ...value, qualitySeal: v })}
        />
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Type</div>
        <div className="space-y-1">
          {typeRows.map((row) => (
            <Toggle
              key={row.join("-")}
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
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Status</div>
        <Toggle
          options={sortedStatuses}
          value={value.statuses}
          onChange={(v) => onChange({ ...value, statuses: v })}
          renderLabel={(s) => STATUS_LABELS[s]}
          cols={2}
        />
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Country</div>
        <Toggle
          options={sortedCountries}
          value={value.countries}
          onChange={(v) => onChange({ ...value, countries: v })}
          cols={2}
        />
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Portfolio</div>
        <Toggle
          options={portfolios}
          value={value.portfolios}
          onChange={(v) => onChange({ ...value, portfolios: v })}
          renderLabel={(p) => (p === PORTFOLIO_NONE ? "None" : p)}
          cols={2}
        />
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Complexity</div>
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
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Aircraft programs</div>
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
