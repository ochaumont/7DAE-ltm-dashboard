import { cache } from "react";
import { fetchLabTestMean, fetchLabTestMeans } from "./atom-api";
import { toLabTestMean } from "./labtestmean-adapter";
import type {
  Complexity,
  LabTestMean,
  LabTestMeanStatus,
  LabTestMeanType,
} from "./types";

export const getLabTestMeans = cache(async (): Promise<LabTestMean[]> => {
  const dtos = await fetchLabTestMeans();
  return dtos.map(toLabTestMean);
});

export const getLabTestMeanByExternalId = cache(
  async (externalId: string): Promise<LabTestMean | null> => {
    const dto = await fetchLabTestMean(externalId);
    return dto ? toLabTestMean(dto) : null;
  },
);

/** Sentinel option in the Portfolio filter that matches LTMs with `portfolio === null`. */
export const PORTFOLIO_NONE = "__none__";

/** Sentinel option in the Complexity filter that matches LTMs with `complexity === null`. */
export const COMPLEXITY_NA = "__na__";

export type Filters = {
  search?: string;
  types?: LabTestMeanType[];
  statuses?: LabTestMeanStatus[];
  countries?: string[];
  programNodeNames?: Set<string>;
  includeUnassignedPrograms?: boolean;
  complexities?: string[];
  portfolios?: string[];
};

export function filterLabTestMeans(
  list: LabTestMean[],
  f: Filters,
): LabTestMean[] {
  return list.filter((m) => {
    if (f.types?.length && !f.types.includes(m.type)) return false;
    if (f.statuses?.length && !f.statuses.includes(m.status)) return false;
    if (f.countries?.length && !f.countries.includes(m.location.country))
      return false;
    const programFilterActive =
      (f.programNodeNames && f.programNodeNames.size > 0) ||
      f.includeUnassignedPrograms;
    if (programFilterActive) {
      if (m.programs.length === 0) {
        if (!f.includeUnassignedPrograms) return false;
      } else if (
        !f.programNodeNames ||
        !m.programs.some((p) => f.programNodeNames!.has(p))
      ) {
        return false;
      }
    }
    if (f.complexities?.length) {
      if (m.complexity == null) {
        if (!f.complexities.includes(COMPLEXITY_NA)) return false;
      } else if (!f.complexities.includes(m.complexity)) {
        return false;
      }
    }
    if (f.portfolios?.length) {
      if (m.portfolio == null) {
        if (!f.portfolios.includes(PORTFOLIO_NONE)) return false;
      } else if (!f.portfolios.includes(m.portfolio.name)) {
        return false;
      }
    }
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = [
        m.name,
        m.externalId,
        m.description,
        m.manager?.name ?? "",
        ...m.programs,
        ...m.projects,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function uniqueCountries(list: LabTestMean[]): string[] {
  return Array.from(new Set(list.map((m) => m.location.country))).sort();
}
export function uniqueTypes(list: LabTestMean[]): LabTestMeanType[] {
  return Array.from(new Set(list.map((m) => m.type)));
}
export function uniqueStatuses(list: LabTestMean[]): LabTestMeanStatus[] {
  return Array.from(new Set(list.map((m) => m.status)));
}
export function uniqueComplexities(list: LabTestMean[]): string[] {
  const out = new Set<Complexity>();
  let hasNa = false;
  for (const m of list) {
    if (m.complexity) out.add(m.complexity);
    else hasNa = true;
  }
  const result: string[] = Array.from(out);
  if (hasNa) result.push(COMPLEXITY_NA);
  return result;
}
export function uniquePortfolios(list: LabTestMean[]): string[] {
  const names = new Set<string>();
  let hasNone = false;
  for (const m of list) {
    if (m.portfolio) names.add(m.portfolio.name);
    else hasNone = true;
  }
  const sorted = Array.from(names).sort();
  if (hasNone) sorted.push(PORTFOLIO_NONE);
  return sorted;
}
