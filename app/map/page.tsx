// Same reason as `app/page.tsx` — keep dynamic to survive build-time backend
// flakes. The fetch `revalidate: 60` provides caching at runtime.
export const dynamic = "force-dynamic";

import MapClient from "@/components/MapClient";
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

export default async function MapPage() {
  const [all, tree] = await Promise.all([
    getLabTestMeans(),
    getAircraftTreeCached(),
  ]);
  const programCounts = computeProgramCounts(tree, all);
  const hasUnassignedPrograms = hasUnassignedLabTestMeans(all);
  return (
    <MapClient
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
  );
}
