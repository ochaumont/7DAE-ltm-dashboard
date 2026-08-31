import type { ComponentType } from "react";
import type { TechnicalCapability } from "@/lib/types";
import {
  AircraftSimulationIcon,
  AutomaticTestingIcon,
  RemoteAccessIcon,
  NoRemoteAccessIcon,
} from "./icons/CapabilityIcon";

type IconComponent = ComponentType<{ size?: number; className?: string }>;

const META: Record<TechnicalCapability, { label: string; Icon: IconComponent }> = {
  "aircraft-simulation-package": {
    label: "Aircraft Simulation Package",
    Icon: AircraftSimulationIcon,
  },
  "automatic-testing": {
    label: "Automatic Testing",
    Icon: AutomaticTestingIcon,
  },
  "remote-access": {
    label: "Remote Access",
    Icon: RemoteAccessIcon,
  },
  "no-remote-access": {
    label: "No Remote Access",
    Icon: NoRemoteAccessIcon,
  },
};

export default function ChipCapability({
  capability,
}: Readonly<{
  capability: TechnicalCapability;
}>) {
  const { label, Icon } = META[capability];
  return (
    <span title={label} aria-label={label} className="inline-flex items-center">
      <Icon size={24} />
    </span>
  );
}
