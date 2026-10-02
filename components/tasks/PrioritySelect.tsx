"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { PRIORITY_META, PRIORITY_ORDER } from "@/lib/priority";
import type { Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

type PrioritySelectProps = {
  value: Priority;
  onChange: (value: Priority) => void;
  /** `sm` for task rows, `md` for the creation bar. */
  size?: "sm" | "md";
  label?: string;
  /** Visually hides the label while keeping it for screen readers. */
  hideLabel?: boolean;
  className?: string;
  disabled?: boolean;
};

const CONTROL = cn(
  "h-11 w-full appearance-none rounded-full border border-border-light bg-surface-card-light pr-9 font-medium text-text-header-light transition-colors",
  "hover:border-accent-strong/50 focus-visible:border-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light",
  "dark:border-border-dark dark:bg-surface-card-dark dark:text-text-header-dark dark:hover:border-accent-primary/60 dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark",
);

/**
 * Priority dropdown (Low / Medium / High).
 *
 * A native <select> is used on purpose: it keeps full keyboard support, the OS
 * picker on mobile, and screen-reader semantics for free. The chosen value is
 * always written out as its label — the colour dot is a second, decorative cue,
 * never the only way to read the level.
 */
export function PrioritySelect({
  value,
  onChange,
  size = "md",
  label = "Priority",
  hideLabel = true,
  className,
  disabled = false,
}: PrioritySelectProps) {
  const id = useId();
  const meta = PRIORITY_META[value];

  return (
    <span className={cn("block min-w-0", className)}>
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>

      <span className="relative flex items-center">
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-3 size-2.5 rounded-full",
            meta.dotClassName,
          )}
        />

        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value as Priority)}
          className={cn(
            CONTROL,
            "pl-8",
            size === "sm" ? "text-xs sm:h-9" : "text-sm",
          )}
        >
          {PRIORITY_ORDER.map((level) => (
            <option key={level} value={level}>
              {PRIORITY_META[level].label}
            </option>
          ))}
        </select>

        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 size-4 text-text-muted-light dark:text-text-muted-dark"
        />
      </span>
    </span>
  );
}
