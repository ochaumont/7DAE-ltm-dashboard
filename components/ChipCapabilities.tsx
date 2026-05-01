import type { TechnicalCapability } from "@/lib/types";
import ChipCapability from "./ChipCapability";

export default function ChipCapabilities({
  capabilities,
}: {
  capabilities: TechnicalCapability[];
}) {
  if (capabilities.length === 0) return null;
  return (
    <>
      {capabilities.map((c) => (
        <ChipCapability key={c} capability={c} />
      ))}
    </>
  );
}
