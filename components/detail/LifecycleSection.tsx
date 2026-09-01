import type { ComponentType } from "react";
import type { Lifecycle } from "@/lib/types";
import {
  KickoffIcon,
  InServiceIcon,
  MothballedIcon,
  DismantledIcon,
} from "@/components/icons/LifecycleStepIcon";
import { formatDate } from "@/lib/format-date";

type StepKey = "kickoff" | "inService" | "mothballed" | "dismantled";

type StepDef = {
  key: StepKey;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  colorVar: string;
  reachedDescription: (formattedDate: string) => string;
  unreachedDescription: string;
};

const STEPS: StepDef[] = [
  {
    key: "kickoff",
    label: "Kickoff",
    Icon: KickoffIcon,
    colorVar: "var(--color-accent)",
    reachedDescription: (d) => `Project started in ${d}`,
    unreachedDescription: "Not started",
  },
  {
    key: "inService",
    label: "In Service",
    Icon: InServiceIcon,
    colorVar: "var(--color-success)",
    reachedDescription: (d) => `Operational since ${d}`,
    unreachedDescription: "Not yet in service",
  },
  {
    key: "mothballed",
    label: "Mothballed",
    Icon: MothballedIcon,
    colorVar: "var(--color-warning)",
    reachedDescription: (d) => `Mothballed since ${d}`,
    unreachedDescription: "Not mothballed",
  },
  {
    key: "dismantled",
    label: "Dismantled",
    Icon: DismantledIcon,
    colorVar: "var(--color-danger)",
    reachedDescription: (d) => `Dismantled in ${d}`,
    unreachedDescription: "Still in service",
  },
];

function StepCard({
  step,
  rawDate,
}: Readonly<{
  step: StepDef;
  rawDate?: string;
}>) {
  const reached = !!rawDate;
  const formatted = formatDate(rawDate);
  const description = reached
    ? step.reachedDescription(formatted)
    : step.unreachedDescription;

  return (
    <li
      className="pl-3 py-1.5 border-l-[3px] flex items-start gap-3"
      style={{
        borderLeftColor: reached ? step.colorVar : "var(--color-border)",
      }}
    >
      <div
        className="flex items-center gap-2 shrink-0"
        style={{ color: reached ? step.colorVar : "var(--color-muted)" }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={
            reached
              ? { backgroundColor: step.colorVar }
              : {
                  backgroundColor: "transparent",
                  boxShadow: "inset 0 0 0 1px var(--color-muted)",
                }
          }
        />
        <step.Icon size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-fg">{step.label}</div>
        <div className="text-xs text-muted mt-0.5">{description}</div>
      </div>
    </li>
  );
}

export default function LifecycleSection({
  lifecycle,
}: Readonly<{
  lifecycle: Lifecycle;
}>) {
  return (
    <ul className="space-y-3">
      {STEPS.map((s) => (
        <StepCard key={s.key} step={s} rawDate={lifecycle[s.key]} />
      ))}
    </ul>
  );
}
