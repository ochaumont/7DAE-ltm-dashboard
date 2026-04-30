import type { LabTestMeanType } from "@/lib/types";

const labels: Record<LabTestMeanType, string> = {
  SIB: "SIB",
  SIMU: "SIMU",
  FIB: "FIB",
  RT: "Mean ResearchOnTest",
  NA: "NA",
};

export default function ChipType({ type }: { type: LabTestMeanType }) {
  return (
    <span className="chip-type inline-flex items-center px-2 py-0.5 rounded">
      {labels[type]}
    </span>
  );
}
