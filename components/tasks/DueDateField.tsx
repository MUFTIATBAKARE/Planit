"use client";

import { useId } from "react";
import { CalendarDays, X } from "lucide-react";
import { cn, getDueDateState } from "@/lib/utils";

type DueDateFieldProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  /** `sm` for task rows, `md` for the creation bar. */
  size?: "sm" | "md";
  label?: string;
  /** Visually hides the label while keeping it for screen readers. */
  hideLabel?: boolean;
  className?: string;
  disabled?: boolean;
};

/**
 * Native `<input type="date">` bound to the stored `YYYY-MM-DD` string.
 *
 * The native picker gives us the platform calendar on every device (no custom
 * popover to make keyboard-accessible), and the overdue state is announced as
 * written copy — "Overdue by 2 days" — so it never relies on the red tint.
 */
export function DueDateField({
  value,
  onChange,
  size = "md",
  label = "Due date",
  hideLabel = true,
  className,
  disabled = false,
}: DueDateFieldProps) {
  const id = useId();
  const state = getDueDateState(value);

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
        <CalendarDays
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-3 size-4",
            state?.isOverdue
              ? "text-danger"
              : "text-text-muted-light dark:text-text-muted-dark",
          )}
        />

        <input
          id={id}
          type="date"
          value={value ?? ""}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value || null)}
          className={cn(
            "min-w-0 rounded-full border bg-surface-card-light pl-9 pr-14 font-medium text-text-header-light transition-colors",
            "[color-scheme:light] dark:[color-scheme:dark]",
            "hover:border-accent-strong/50 focus-visible:border-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light",
            "dark:border-border-dark dark:bg-surface-card-dark dark:text-text-header-dark dark:hover:border-accent-primary/60 dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark",
            size === "md" ? "h-11 w-full text-sm" : "h-11 text-xs sm:h-9",
            state?.isOverdue
              ? "border-danger text-danger"
              : "border-border-light",
          )}
        />

        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Clear ${label.toLowerCase()}`}
            className="absolute right-9 grid size-7 place-items-center rounded-full text-text-muted-light transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card-light dark:text-text-muted-dark dark:focus-visible:ring-offset-surface-card-dark"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        ) : null}
      </span>

      {state ? (
        <span
          className={cn(
            "mt-1 block text-xs font-medium",
            state.isOverdue
              ? "text-danger"
              : "text-text-muted-light dark:text-text-muted-dark",
          )}
        >
          {state.label}
        </span>
      ) : null}
    </span>
  );
}
