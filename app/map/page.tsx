export const dynamic = "force-dynamic";

import MapClient from "@/components/MapClient";
import {
  getLabTestMeans,
  uniqueComplexities,
  uniqueCountries,
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
    />
  );
}
