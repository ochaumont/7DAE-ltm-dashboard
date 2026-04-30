import type { Complexity } from "@/lib/types";
import ComplexityIcon from "./icons/ComplexityIcon";

const labels: Record<Complexity, string> = {
  simple: "Simple",
  medium: "Medium",
  complex: "Complex",
};

export default function ChipComplexity({
  level,
}: {
  level: Complexity | null;
}) {
  if (!level) return null;
  const label = labels[level];
  return (
    <span
      title={label}
      aria-label={`Complexity: ${label}`}
      className="inline-flex items-center"
    >
      <ComplexityIcon level={level} size={20} />
    </span>
  );
}
