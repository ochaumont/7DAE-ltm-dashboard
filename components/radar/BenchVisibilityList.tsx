import { useState } from "react";
import type { LabTestMean } from "@/lib/types";
import CollapsibleSection from "./CollapsibleSection";

type Props = {
  benches: LabTestMean[];
  hiddenIds: Set<string>;
  onToggle: (externalId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
};

/**
 * Second, finer-grained refinement step on top of `FilterBar`'s coarse
 * filters: lets the user individually hide/show benches that already match
 * the active filters, without changing those filters. Native checkboxes
 * (not `FilterBar`'s chip-style `Toggle`) since this list can hold up to the
 * configurable density limit (`lib/radarDisplaySettings.ts`, up to 500).
 */
export default function BenchVisibilityList({
  benches,
  hiddenIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: Readonly<Props>) {
  const hiddenCount = benches.filter((b) => hiddenIds.has(b.externalId)).length;
  const displayedCount = benches.length - hiddenCount;
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  // Search only narrows which rows are shown — Select all/Deselect all always
  // act on the full `benches` list, not just the current search match.
  const filtered = q ? benches.filter((b) => b.name.toLowerCase().includes(q)) : benches;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <CollapsibleSection
        title={`Displayed LTM (${displayedCount}/${benches.length})`}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="mb-1.5 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-accent"
        />
        <div className="mb-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={hiddenCount === 0}
            className="text-[11px] text-accent hover:underline disabled:text-muted disabled:no-underline disabled:cursor-not-allowed"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            disabled={hiddenCount === benches.length}
            className="text-[11px] text-accent hover:underline disabled:text-muted disabled:no-underline disabled:cursor-not-allowed"
          >
            Deselect all
          </button>
        </div>
        <div className="max-h-[240px] overflow-y-auto rounded border border-border">
          {filtered.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted">No match.</p>
          ) : (
            filtered.map((b) => (
              <label
                key={b.externalId}
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-fg hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={!hiddenIds.has(b.externalId)}
                  onChange={() => onToggle(b.externalId)}
                  className="shrink-0 accent-accent"
                />
                <span className="truncate">{b.name}</span>
              </label>
            ))
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
