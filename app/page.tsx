// Backend may be unreachable at build time (dev ATOM is flaky). Forcing
// dynamic rendering avoids killing the build; the in-fetch `revalidate: 60`
// still caches per-request once the page renders.
export const dynamic = "force-dynamic";

import { Suspense } from "react";
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
    <Suspense>
      <CatalogueClient
        labTestMeans={all}
        types={uniqueTypes(all)}
        statuses={uniqueStatuses(all)}
        countries={uniqueCountries(all)}
        programs={uniquePrograms(all)}
        complexities={uniqueComplexities(all)}
      />
    </Suspense>
  );
}
