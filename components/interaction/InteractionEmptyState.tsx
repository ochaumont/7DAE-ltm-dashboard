type Props = {
  reason: "no-selection" | "no-relations" | "layout-loading" | "layout-error";
};

const MESSAGES: Record<Props["reason"], string> = {
  "no-selection": "Select a bench to view its dependencies.",
  "no-relations": "No known dependency for this bench.",
  "layout-loading": "Computing the graph layout…",
  "layout-error": "Could not compute the graph layout.",
};

export default function InteractionEmptyState({ reason }: Props) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted">{MESSAGES[reason]}</p>
    </div>
  );
}
