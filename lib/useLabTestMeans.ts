"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { getLabTestMeans } from "./labtestmeans";
import {
  getAircraftTree,
  computeProgramCounts,
  hasUnassignedLabTestMeans,
} from "./aircraftStructure";
import {
  uniqueComplexities,
  uniqueCountries,
  uniquePortfolios,
  uniqueStatuses,
  uniqueTypes,
} from "./labtestmeans";
import type {
  AircraftStructureNode,
  LabTestMean,
  LabTestMeanStatus,
  LabTestMeanType,
} from "./types";

/** Stable SWR keys for the two backend datasets — shared by the catalogue, the
 * map, the detail page (cache-first) and the Header refresh button. */
export const SWR_KEY_LTM = "labtestmeans";
export const SWR_KEY_TREE = "aircraft-tree";

// Stable empty references so memoised derivations don't churn while loading.
const EMPTY_LTM: LabTestMean[] = [];
const EMPTY_TREE: AircraftStructureNode[] = [];

export type LabTestMeansData = {
  labTestMeans: LabTestMean[];
  tree: AircraftStructureNode[];
  programCounts: Map<string, number>;
  hasUnassignedPrograms: boolean;
  types: LabTestMeanType[];
  statuses: LabTestMeanStatus[];
  countries: string[];
  complexities: string[];
  portfolios: string[];
  loading: boolean;
  error: Error | null;
};

/**
 * Loads the lab test means + aircraft tree ONCE per session via SWR (cached and
 * shared across pages), and memoises every derived value so they are not
 * recomputed on each render (e.g. while typing in the filters).
 */
export function useLabTestMeans(): LabTestMeansData {
  const { data: ltmData, error } = useSWR(SWR_KEY_LTM, getLabTestMeans);
  // The tree fetcher swallows its own errors (returns []), so it never drives
  // the error screen — only the lab test means do.
  const { data: treeData } = useSWR(SWR_KEY_TREE, getAircraftTree);

  const labTestMeans = ltmData ?? EMPTY_LTM;
  const tree = treeData ?? EMPTY_TREE;
  const loading = !ltmData && !error;

  const programCounts = useMemo(
    () => computeProgramCounts(tree, labTestMeans),
    [tree, labTestMeans],
  );
  const hasUnassignedPrograms = useMemo(
    () => hasUnassignedLabTestMeans(labTestMeans),
    [labTestMeans],
  );
  const types = useMemo(() => uniqueTypes(labTestMeans), [labTestMeans]);
  const statuses = useMemo(() => uniqueStatuses(labTestMeans), [labTestMeans]);
  const countries = useMemo(() => uniqueCountries(labTestMeans), [labTestMeans]);
  const complexities = useMemo(
    () => uniqueComplexities(labTestMeans),
    [labTestMeans],
  );
  const portfolios = useMemo(
    () => uniquePortfolios(labTestMeans),
    [labTestMeans],
  );

  return {
    labTestMeans,
    tree,
    programCounts,
    hasUnassignedPrograms,
    types,
    statuses,
    countries,
    complexities,
    portfolios,
    loading,
    error: (error as Error) ?? null,
  };
}
