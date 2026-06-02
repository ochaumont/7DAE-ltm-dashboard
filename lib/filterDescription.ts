import type { FilterValue } from "@/components/FilterBar";
import { PORTFOLIO_NONE } from "@/lib/labtestmeans";
import { UNASSIGNED_NODE_ID } from "@/lib/aircraftStructure";
import type { AircraftStructureNode } from "@/lib/types";
import { STATUS_LABELS, COMPLEXITY_LABELS } from "@/lib/labels";

export function serializeFilters(
  filters: FilterValue,
  tree?: AircraftStructureNode[],
): string {
  const lines: string[] = [];

  if (filters.search.trim()) lines.push(`Search: "${filters.search.trim()}"`);
  if (filters.types.length > 0) lines.push(`Type: ${filters.types.join(", ")}`);
  if (filters.statuses.length > 0) {
    lines.push(
      `Status: ${filters.statuses.map((s) => STATUS_LABELS[s] ?? s).join(", ")}`,
    );
  }
  if (filters.countries.length > 0) {
    lines.push(`Country: ${filters.countries.join(", ")}`);
  }
  if (filters.programNodeIds.length > 0) {
    const idToName = new Map<string, string>();
    const walk = (n: AircraftStructureNode) => {
      idToName.set(n.id, n.name);
      n.children?.forEach(walk);
    };
    (tree ?? []).forEach(walk);
    const labels = filters.programNodeIds.map((id) =>
      id === UNASSIGNED_NODE_ID ? "Unassigned" : (idToName.get(id) ?? id),
    );
    lines.push(`Aircraft programs: ${labels.join(", ")}`);
  }
  if (filters.complexities.length > 0) {
    lines.push(
      `Complexity: ${filters.complexities.map((c) => COMPLEXITY_LABELS[c] ?? c).join(", ")}`,
    );
  }
  if (filters.portfolios.length > 0) {
    lines.push(
      `Portfolio: ${filters.portfolios.map((p) => (p === PORTFOLIO_NONE ? "None" : p)).join(", ")}`,
    );
  }

  return lines.length === 0
    ? "All benches (no filters applied)"
    : lines.join("\n");
}
