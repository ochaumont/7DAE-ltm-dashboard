"use client";

import { useEffect, useState } from "react";
import { getLabTestMeans } from "./labtestmeans";
import { getAircraftTree } from "./aircraftStructure";
import {
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

export function useLabTestMeans(): LabTestMeansData {
  const [labTestMeans, setLabTestMeans] = useState<LabTestMean[]>([]);
  const [tree, setTree] = useState<AircraftStructureNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getLabTestMeans(), getAircraftTree()])
      .then(([ltms, t]) => {
        if (cancelled) return;
        setLabTestMeans(ltms);
        setTree(t);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    labTestMeans,
    tree,
    programCounts: computeProgramCounts(tree, labTestMeans),
    hasUnassignedPrograms: hasUnassignedLabTestMeans(labTestMeans),
    types: uniqueTypes(labTestMeans),
    statuses: uniqueStatuses(labTestMeans),
    countries: uniqueCountries(labTestMeans),
    complexities: uniqueComplexities(labTestMeans),
    portfolios: uniquePortfolios(labTestMeans),
    loading,
    error,
  };
}
