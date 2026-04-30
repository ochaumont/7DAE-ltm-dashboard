export const dynamic = "force-dynamic";

import CatalogueClient from "@/components/CatalogueClient";
import {
  getLabTestMeans,
  uniqueComplexities,
  uniqueCountries,
  uniquePrograms,
  uniqueStatuses,
  uniqueTypes,
} from "@/lib/labtestmeans";

export default async function CataloguePage() {
  const all = await getLabTestMeans();
  return (
    <CatalogueClient
      labTestMeans={all}
      types={uniqueTypes(all)}
      statuses={uniqueStatuses(all)}
      countries={uniqueCountries(all)}
      programs={uniquePrograms(all)}
      complexities={uniqueComplexities(all)}
    />
  );
}
