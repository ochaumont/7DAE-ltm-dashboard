import type { Complexity } from "@/lib/types";
import ComplexityIcon from "./icons/ComplexityIcon";

const labels: Record<Complexity, string> = {
  simple: "Simple complexity",
  medium: "Medium complexity",
  complex: "Complex complexity",
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
      aria-label={label}
      className="inline-flex items-center"
    >
      <ComplexityIcon level={level} size={24} />
    </span>
  );
}
