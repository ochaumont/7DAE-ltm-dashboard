// Same reason as `app/page.tsx` — keep dynamic to survive build-time backend
// flakes. The fetch `revalidate: 60` provides caching at runtime.
export const dynamic = "force-dynamic";

import MapClient from "@/components/MapClient";
import {
  getLabTestMeans,
  uniqueComplexities,
  uniqueCountries,
  uniquePortfolios,
  uniquePrograms,
  uniqueStatuses,
  uniqueTypes,
} from "@/lib/labtestmeans";

export default async function MapPage() {
  const all = await getLabTestMeans();
  return (
    <MapClient
      labTestMeans={all}
      types={uniqueTypes(all)}
      statuses={uniqueStatuses(all)}
      countries={uniqueCountries(all)}
      programs={uniquePrograms(all)}
      complexities={uniqueComplexities(all)}
      portfolios={uniquePortfolios(all)}
    />
  );
}
