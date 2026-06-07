import { fetchAircraftStructureTree } from "./atom-api";
import type { AircraftStructureNode, LabTestMean } from "./types";

export const UNASSIGNED_NODE_ID = "__unassigned__";

export async function getAircraftTree(): Promise<AircraftStructureNode[]> {
  try {
    return await fetchAircraftStructureTree();
  } catch {
    return [];
  }
}

export function flattenDescendantNames(
  node: AircraftStructureNode,
): Set<string> {
  const out = new Set<string>();
  const walk = (n: AircraftStructureNode) => {
    out.add(n.name);
    n.children?.forEach(walk);
  };
  walk(node);
  return out;
}

export function expandSelection(
  tree: AircraftStructureNode[],
  selectedIds: string[],
): { names: Set<string>; includeUnassigned: boolean } {
  const names = new Set<string>();
  let includeUnassigned = false;
  if (selectedIds.length === 0) return { names, includeUnassigned };
  const selectedSet = new Set(selectedIds);
  if (selectedSet.has(UNASSIGNED_NODE_ID)) {
    includeUnassigned = true;
    selectedSet.delete(UNASSIGNED_NODE_ID);
  }
  const walk = (n: AircraftStructureNode, ancestorSelected: boolean) => {
    const selected = ancestorSelected || selectedSet.has(n.id);
    if (selected) {
      flattenDescendantNames(n).forEach((nm) => names.add(nm));
    }
    n.children?.forEach((c) => walk(c, selected));
  };
  tree.forEach((n) => walk(n, false));
  return { names, includeUnassigned };
}

export function computeProgramCounts(
  tree: AircraftStructureNode[],
  ltms: LabTestMean[],
): Map<string, number> {
  const counts = new Map<string, number>();
  let unassignedCount = 0;
  for (const m of ltms) {
    if (m.programs.length === 0) unassignedCount++;
  }
  const ltmNames = ltms.map((m) => new Set(m.programs));
  const walk = (n: AircraftStructureNode) => {
    const descendants = flattenDescendantNames(n);
    let c = 0;
    for (const names of ltmNames) {
      for (const name of descendants) {
        if (names.has(name)) {
          c++;
          break;
        }
      }
    }
    counts.set(n.id, c);
    n.children?.forEach(walk);
  };
  tree.forEach(walk);
  if (unassignedCount > 0) counts.set(UNASSIGNED_NODE_ID, unassignedCount);
  return counts;
}

export function hasUnassignedLabTestMeans(ltms: LabTestMean[]): boolean {
  return ltms.some((m) => m.programs.length === 0);
}
