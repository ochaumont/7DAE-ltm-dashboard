"use client";

import { useState } from "react";
import type {
  Complexity,
  LabTestMeanStatus,
  LabTestMeanType,
} from "@/lib/types";
import clsx from "clsx";

const STATUS_LABELS: Record<LabTestMeanStatus, string> = {
  operational: "Operational",
  mothballed: "Mothballed",
  "out-of-service": "Out of Service",
  "in-project": "In Project",
};

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
  programs: string[];
  complexities: Complexity[];
};

type Props = {
  types: LabTestMeanType[];
  statuses: LabTestMeanStatus[];
  countries: string[];
  programs: string[];
  complexities: Complexity[];
  value: FilterValue;
  onChange: (v: FilterValue) => void;
};

function Toggle<T extends string>({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options: T[];
  value: T[];
  onChange: (v: T[]) => void;
  renderLabel?: (o: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
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
              "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
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
  programs,
  complexities,
  value,
  onChange,
}: Props) {
  const [search, setSearch] = useState(value.search);
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
          options={types}
          value={value.types}
          onChange={(v) => onChange({ ...value, types: v })}
          renderLabel={(t) => TYPE_LABELS[t]}
        />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Status</div>
        <Toggle
          options={statuses}
          value={value.statuses}
          onChange={(v) => onChange({ ...value, statuses: v })}
          renderLabel={(s) => STATUS_LABELS[s]}
        />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Complexity</div>
        <Toggle
          options={complexities}
          value={value.complexities}
          onChange={(v) => onChange({ ...value, complexities: v })}
          renderLabel={(c) => c.charAt(0).toUpperCase() + c.slice(1)}
        />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Country</div>
        <Toggle
          options={countries}
          value={value.countries}
          onChange={(v) => onChange({ ...value, countries: v })}
        />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Program</div>
        <Toggle
          options={programs}
          value={value.programs}
          onChange={(v) => onChange({ ...value, programs: v })}
        />
      </div>
    </div>
  );
}
