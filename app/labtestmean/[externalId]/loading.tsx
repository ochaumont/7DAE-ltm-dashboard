/**
 * Skeleton rendered while the per-LTM endpoint resolves.
 *
 * Matches the layout of `page.tsx` (gallery left, header right, sections
 * below) so there is no visual jump when the real content swaps in.
 */
export default function Loading() {
  return (
    <main className="px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <div className="inline-block text-xs font-mono text-muted mb-6">
        ← Back to catalog
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 mb-12">
        <div className="space-y-3">
          <div className="aspect-video bg-surface-2 rounded-card skeleton-pulse" />
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded bg-surface-2 skeleton-pulse"
              />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-9 w-3/4 rounded bg-surface-2 skeleton-pulse" />
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded bg-surface-2 skeleton-pulse" />
            <div className="h-6 w-24 rounded bg-surface-2 skeleton-pulse" />
            <div className="h-6 w-6 rounded bg-surface-2 skeleton-pulse" />
          </div>
          <div className="h-5 w-2/3 rounded bg-surface-2 skeleton-pulse" />
          <div className="h-4 w-1/3 rounded bg-surface-2 skeleton-pulse" />
          <div className="space-y-3 pt-2 max-w-detail-info">
            <div className="h-16 rounded-card bg-surface-2 skeleton-pulse" />
            <div className="h-16 rounded-card bg-surface-2 skeleton-pulse" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-3 w-24 rounded bg-surface-2 skeleton-pulse" />
            <div className="h-4 w-full rounded bg-surface-2 skeleton-pulse" />
            <div className="h-4 w-2/3 rounded bg-surface-2 skeleton-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
