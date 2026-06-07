import { Suspense } from "react";
import LabTestMeanDetailClient from "@/components/LabTestMeanDetailClient";

// Static single page. The lab test mean id is read from `?id=` by the client
// component (useSearchParams), which then fetches its data in the browser. No
// dynamic route segment, so no per-id pre-generation and no build-time backend
// dependency — any id (including newly added ones) works without a rebuild.
export default function LabTestMeanDetailPage() {
  return (
    <Suspense>
      <LabTestMeanDetailClient />
    </Suspense>
  );
}
