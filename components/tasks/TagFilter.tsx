"use client";

import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

type TagFilterProps = {
  /** Distinct tags currently in use across the visible workspace. */
  tags: string[];
  /** `null` means "all tags". */
  value: string | null;
  onChange: (tag: string | null) => void;
  className?: string;
};

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark";

/**
 * Quick tag selector pills. Renders nothing when no tags exist yet, so the
 * dashboard stays clean for users who never categorise.
 *
 * Uses `aria-pressed` (a toggle group) rather than a tablist, because picking a
 * tag narrows the same list the status tabs already control.
 */
export function TagFilter({
  tags,
  value,
  onChange,
  className,
}: TagFilterProps) {
  if (tags.length === 0) return null;

  const pillClassName = (isActive: boolean) =>
    cn(
      "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
      isActive
        ? "border-accent-strong bg-accent-strong text-accent-fg"
        : "border-border-light bg-surface-card-light text-text-body-light hover:border-accent-strong/50 hover:text-accent-strong dark:border-border-dark dark:bg-surface-card-dark dark:text-text-body-dark dark:hover:border-accent-primary/60 dark:hover:text-accent-primary",
      FOCUS,
    );

  return (
    <div
      role="group"
      aria-label="Filter by tag"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
        <Tag aria-hidden="true" className="size-3.5" />
        Tags
      </span>

      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        className={pillClassName(value === null)}
      >
        All
      </button>

      {tags.map((tag) => {
        const isActive = value === tag;

        return (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(isActive ? null : tag)}
            aria-pressed={isActive}
            className={pillClassName(isActive)}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}