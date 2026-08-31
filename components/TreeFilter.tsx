"use client";

import { useState } from "react";
import clsx from "clsx";
import type { AircraftStructureNode } from "@/lib/types";
import { UNASSIGNED_NODE_ID } from "@/lib/aircraftStructure";

type Props = {
  tree: AircraftStructureNode[];
  hasUnassigned: boolean;
  selectedIds: string[];
  counts: Map<string, number>;
  onChange: (ids: string[]) => void;
};

function sortByName(nodes: AircraftStructureNode[]): AircraftStructureNode[] {
  return [...nodes].sort((a, b) => a.name.localeCompare(b.name));
}

export default function TreeFilter({
  tree,
  hasUnassigned,
  selectedIds,
  counts,
  onChange,
}: Readonly<Props>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const toggleSelected = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const renderNode = (
    node: AircraftStructureNode,
    depth: number,
  ): React.ReactNode => {
    const hasChildren = !!node.children?.length;
    const isExpanded = expanded.has(node.id);
    const isSelected = selectedIds.includes(node.id);
    const count = counts.get(node.id) ?? 0;
    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-1.5 py-0.5 text-xs"
          style={{ paddingLeft: depth * 12 }}
        >
          {hasChildren ? (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse" : "Expand"}
              onClick={() => toggleExpanded(node.id)}
              className="w-4 h-4 flex items-center justify-center text-muted hover:text-fg"
            >
              <span aria-hidden="true">{isExpanded ? "▾" : "▸"}</span>
            </button>
          ) : (
            <span className="w-4 h-4" aria-hidden="true" />
          )}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelected(node.id)}
            className="accent-accent cursor-pointer"
          />
          <span
            className={clsx(
              "cursor-pointer",
              isSelected ? "font-semibold text-fg" : "text-fg",
            )}
            onClick={() => toggleSelected(node.id)}
          >
            {node.name}
          </span>
          {count > 0 && (
            <span className="text-xs text-muted">({count})</span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {sortByName(node.children!).map((c) => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const unassignedCount = counts.get(UNASSIGNED_NODE_ID) ?? 0;
  const unassignedSelected = selectedIds.includes(UNASSIGNED_NODE_ID);

  return (
    <div className="max-h-[32vh] overflow-y-auto -mx-1 px-1">
      {sortByName(tree).map((n) => renderNode(n, 0))}
      {hasUnassigned && (
        <div className="flex items-center gap-1.5 py-0.5 text-xs border-t border-border mt-1 pt-2">
          <span className="w-4 h-4" aria-hidden="true" />
          <input
            type="checkbox"
            checked={unassignedSelected}
            onChange={() => toggleSelected(UNASSIGNED_NODE_ID)}
            className="accent-accent cursor-pointer"
          />
          <span
            className={clsx(
              "cursor-pointer italic",
              unassignedSelected ? "font-semibold text-fg" : "text-muted",
            )}
            onClick={() => toggleSelected(UNASSIGNED_NODE_ID)}
          >
            Unassigned
          </span>
          {unassignedCount > 0 && (
            <span className="text-xs text-muted">({unassignedCount})</span>
          )}
        </div>
      )}
    </div>
  );
}
