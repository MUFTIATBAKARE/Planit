/**
 * Skeleton shimmer shown while the first Firestore snapshot is still in flight.
 *
 * The blocks pulse with Tailwind's `animate-pulse`, and the whole block is
 * inside a polite live region with a text equivalent so a screen reader is told
 * the list is loading rather than being read a pile of empty boxes.
 */
export function TaskListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-2 sm:space-y-3">
      <span className="sr-only">Loading your tasks…</span>

      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex items-start gap-2 rounded-card border border-border-light bg-surface-card-light p-2 shadow-card sm:p-2.5 dark:border-border-dark dark:bg-surface-card-dark"
        >
          {/* Checkbox placeholder */}
          <span className="grid size-11 shrink-0 place-items-center">
            <span className="size-6 animate-pulse rounded-full bg-border-light dark:bg-border-dark" />
          </span>

          {/* Title + meta placeholder */}
          <span className="min-w-0 flex-1 space-y-2 py-1.5">
            <span className="block h-4 w-3/5 animate-pulse rounded-full bg-border-light dark:bg-border-dark" />
            <span className="block h-3 w-2/5 animate-pulse rounded-full bg-border-light/80 dark:bg-border-dark/80" />
          </span>

          {/* Row action placeholder */}
          <span className="grid size-11 shrink-0 place-items-center">
            <span className="size-4 animate-pulse rounded-full bg-border-light dark:bg-border-dark" />
          </span>
        </div>
      ))}
    </div>
  );
}