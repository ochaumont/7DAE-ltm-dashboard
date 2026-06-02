import type { LabTestMeanType } from "@/lib/types";
import TypeIcon from "./icons/TypeIcon";
import { TYPE_LABELS } from "@/lib/labels";

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
      {TYPE_LABELS[type]}
    </span>
  );
}
