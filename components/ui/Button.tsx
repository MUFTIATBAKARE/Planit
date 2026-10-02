import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

/*
 * Shared control shell: identical pill rounding, padding and focus-visible
 * treatment for buttons on the landing page, the auth screen and the dashboard
 * task bar, so every screen stays visually in step with the reference artwork.
 */
const BASE =  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,border-color,color,box-shadow,filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:focus-visible:ring-offset-app-bg-dark disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS: Record<ButtonVariant, string> = {
  /* #5858f4 (sampled from the reference) carries white text at 5.05:1 — AA. */
  primary:
    "bg-accent-strong text-accent-fg shadow-sm hover:bg-accent-deep focus-visible:ring-accent-strong dark:focus-visible:ring-accent-primary",
  secondary:
    "border border-border-light bg-surface-card-light text-text-header-light hover:border-accent-strong/50 hover:text-accent-strong focus-visible:ring-accent-strong dark:border-border-dark dark:bg-surface-card-dark dark:text-text-header-dark dark:hover:border-accent-primary/60 dark:hover:text-accent-primary dark:focus-visible:ring-accent-primary",
  ghost:
    "text-text-body-light hover:bg-border-light/70 hover:text-text-header-light focus-visible:ring-accent-strong dark:text-text-body-dark dark:hover:bg-border-dark/70 dark:hover:text-text-header-dark dark:focus-visible:ring-accent-primary",
  danger:
    "bg-danger text-danger-fg shadow-sm hover:brightness-95 focus-visible:ring-danger",
};

/* 44px minimum touch target on the default size (WCAG 2.5.5 / mobile rules). */
const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-base",
};

export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles(variant, size, className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading ? <Spinner /> : null}
      {children}
    </button>
  );
}
