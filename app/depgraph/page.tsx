import { Suspense } from "react";
import InteractionClient from "@/components/InteractionClient";

// Static page. The selected bench is read from `?id=` by the client component
// (useSearchParams), same convention as `/labtestmean?id=`.
export default function InteractionPage() {
  return (
    <Suspense>
      <InteractionClient />
    </Suspense>
  );
}
