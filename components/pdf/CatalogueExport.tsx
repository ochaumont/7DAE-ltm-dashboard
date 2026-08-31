import { Document } from "@react-pdf/renderer";
import type { LabTestMean } from "@/lib/types";
import CoverPage from "./CoverPage";
import TableOfContents from "./TableOfContents";
import BenchDetailPage from "./BenchDetailPage";

export type ResolvedBench = LabTestMean & { resolvedCover: string | null };

type Props = {
  benches: ResolvedBench[];
  filtersDescription: string;
  baseUrl: string;
};

export default function CatalogueExport({
  benches,
  filtersDescription,
  baseUrl,
}: Readonly<Props>) {
  return (
    <Document title="Lab Test Means — Catalogue Export">
      <CoverPage
        benchCount={benches.length}
        filtersDescription={filtersDescription}
      />
      <TableOfContents benches={benches} baseUrl={baseUrl} />
      {benches.map((b) => (
        <BenchDetailPage key={b.externalId} banc={b} baseUrl={baseUrl} />
      ))}
    </Document>
  );
}
