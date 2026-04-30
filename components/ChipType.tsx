import type { LabTestMeanType } from "@/lib/types";
import TypeIcon from "./icons/TypeIcon";

const labels: Record<LabTestMeanType, string> = {
  SIB: "SIB",
  SIMU: "SIMU",
  FIB: "FIB",
  RT: "Mean ResearchOnTest",
  NA: "NA",
};

export default function ChipType({
  type,
  withIcon = false,
}: {
  type: LabTestMeanType;
  withIcon?: boolean;
}) {
  return (
    <span className="chip-type inline-flex items-center px-2 py-0.5 rounded">
      {withIcon && <TypeIcon type={type} className="mr-1.5" />}
      {labels[type]}
    </span>
  );
}
