/** Overlay spinner shown while a backend photo resource is loading (can take
 * 5-30s) — see `usePhoto`'s `isLoading`. Absolutely positioned; parent must
 * be `relative`. */
export default function PhotoSpinner() {
  return (
    <output
      aria-label="Loading photo"
      className="absolute inset-0 flex items-center justify-center bg-surface-2/70"
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
    </output>
  );
}
