import type { Lifecycle } from "@/lib/types";
import Section from "./Section";

export default function LifecycleSection({
  lifecycle,
}: {
  lifecycle: Lifecycle;
}) {
  const steps: { label: string; date: string }[] = [
    { label: "Kickoff", date: lifecycle.kickoff ?? "" },
    { label: "In service", date: lifecycle.inService ?? "" },
    { label: "Mothballed", date: lifecycle.mothballed ?? "" },
    { label: "Dismantled", date: lifecycle.dismantled ?? "" },
  ].filter((s) => s.date.length > 0);

  return (
    <Section title="Lifecycle">
      {steps.length === 0 ? (
        <div className="text-sm text-muted">No lifecycle data.</div>
      ) : (
        <ul className="space-y-2">
          {steps.map((s) => (
            <li key={s.label} className="flex items-baseline gap-3 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              <span className="text-muted w-28">{s.label}</span>
              <span className="font-mono">{s.date}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
