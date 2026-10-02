"use client";

import { useId } from "react";
import { Lock, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** Guest sessions cannot search: the field degrades to a locked trigger. */
  isLocked?: boolean;
  onLockedClick?: () => void;
  className?: string;
};

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark";

/**
 * Keyword search bar (authenticated) — filters the *visible* task array by
 * title substring, so the Firestore listener is never rebuilt.
 *
 * For a Guest Session it renders as a locked pill instead of an input: the
 * field cannot be typed into at all, and activating it opens the paywall. That
 * is deliberately a <button>, not a disabled <input>, so it stays reachable by
 * keyboard and screen readers while still being inert.
 */
export function TaskSearchField({
  value,
  onChange,
  isLocked = false,
  onLockedClick,
  className,
}: TaskSearchFieldProps) {
  const id = useId();

  if (isLocked) {
    return (
      <button
        type="button"
        onClick={onLockedClick}
        aria-label="Search tasks — available on a free account"
        className={cn(
          "relative flex h-11 w-full items-center gap-2 rounded-full border border-border-light bg-surface-card-light pl-10 pr-3 text-left text-sm text-text-muted-light transition-colors hover:border-accent-strong/50 dark:border-border-dark dark:bg-surface-card-dark dark:text-text-muted-dark dark:hover:border-accent-primary/60",
          FOCUS,
          className,
        )}
      >
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 size-4"
        />
        <span className="truncate">Search tasks…</span>

        <span
          aria-hidden="true"
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-strong dark:bg-accent-primary/15 dark:text-accent-primary"
        >
          <Lock className="size-3" />
          Guest
        </span>
      </button>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Search tasks
      </label>

      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark"
      />

      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search tasks…"
        autoComplete="off"
        className={cn(
          "h-11 w-full rounded-full border border-border-light bg-surface-card-light pl-10 pr-11 text-sm text-text-header-light transition-colors placeholder:text-text-muted-light focus-visible:border-accent-strong dark:border-border-dark dark:bg-surface-card-dark dark:text-text-header-dark dark:placeholder:text-text-muted-dark",
          FOCUS,
        )}
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className={cn(
            "absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-text-muted-light transition-colors hover:bg-app-bg-light hover:text-text-header-light dark:text-text-muted-dark dark:hover:bg-app-bg-dark dark:hover:text-text-header-dark",
            FOCUS,
          )}
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}