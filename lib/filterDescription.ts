import type { FilterValue } from "@/components/FilterBar";
import { PORTFOLIO_NONE } from "@/lib/labtestmeans";

const STATUS_LABELS: Record<string, string> = {
  operational: "Operational",
  mothballed: "Mothballed",
  "out-of-service": "Out of Service",
  "in-project": "In Project",
};

const COMPLEXITY_LABELS: Record<string, string> = {
  simple: "Simple",
  medium: "Medium",
  complex: "Complex",
};

export function serializeFilters(filters: FilterValue): string {
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
  if (filters.programs.length > 0) {
    lines.push(`Programs: ${filters.programs.join(", ")}`);
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
