import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  /** Visually hides the label while keeping it available to screen readers. */
  hideLabel?: boolean;
  error?: string | null;
  hint?: ReactNode;
  /** Slot rendered inside the field, e.g. a password visibility toggle. */
  trailing?: ReactNode;
};

/**
 * Labelled text field. Uses a real <label> + aria-describedby so errors and
 * hints are announced, and keeps the same pill shell as every button.
 */
export function Input({
  label,
  hideLabel = false,
  error,
  hint,
  trailing,
  className,
  ...rest
}: InputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    cn(error ? errorId : null, hint ? hintId : null) || undefined;

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full rounded-full border bg-surface-card-light px-4 text-sm text-text-header-light transition-colors placeholder:text-text-muted-light focus-visible:border-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong dark:bg-surface-card-dark dark:text-text-header-dark dark:placeholder:text-text-muted-dark dark:focus-visible:ring-accent-primary",
            error
              ? "border-danger"
              : "border-border-light dark:border-border-dark",
            trailing ? "pr-12" : null,
            className,
          )}
          {...rest}
        />

        {trailing ? (
          <div className="absolute inset-y-0 right-1 flex items-center">
            {trailing}
          </div>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}

      {hint ? (
        <p
          id={hintId}
          className="mt-1.5 text-xs text-text-muted-light dark:text-text-muted-dark"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
