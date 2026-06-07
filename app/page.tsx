export const dynamic = "force-dynamic";

import { Suspense } from "react";
import CatalogueClient from "@/components/CatalogueClient";
import {
  getLabTestMeans,
  uniqueComplexities,
  uniqueCountries,
  uniquePortfolios,
  uniqueStatuses,
  uniqueTypes,
} from "@/lib/labtestmeans";
import {
  computeProgramCounts,
  getAircraftTreeCached,
  hasUnassignedLabTestMeans,
} from "@/lib/aircraftStructure";

export default async function CataloguePage() {
  const [all, tree] = await Promise.all([
    getLabTestMeans(),
    getAircraftTreeCached(),
  ]);
  const programCounts = computeProgramCounts(tree, all);
  const hasUnassignedPrograms = hasUnassignedLabTestMeans(all);
  return (
    <Suspense>
      <CatalogueClient
        labTestMeans={all}
        types={uniqueTypes(all)}
        statuses={uniqueStatuses(all)}
        countries={uniqueCountries(all)}
        tree={tree}
        programCounts={programCounts}
        hasUnassignedPrograms={hasUnassignedPrograms}
        complexities={uniqueComplexities(all)}
        portfolios={uniquePortfolios(all)}
      />
    </Suspense>
  );
}
