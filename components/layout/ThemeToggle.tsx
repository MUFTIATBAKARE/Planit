"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  /** Rendered next to the icon (sidebar footer); omit for an icon-only button. */
  showLabel?: boolean;
};

/**
 * Manual theme switcher.
 *
 * - Icon-only buttons get a descriptive `aria-label` that always names the
 *   action it will perform next, and `aria-pressed` reports the current state.
 * - The icon spins 180° on every activation and cross-fades between Sun/Moon.
 * - `mounted` keeps the server markup and the first client render identical, so
 *   hydration never mismatches even though the theme itself is client-only.
 */
export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, mounted, toggleTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const isDark = mounted && theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      className={cn(
        "group inline-flex min-h-11 items-center gap-3 rounded-full border border-border-light bg-surface-card-light px-3 text-sm font-medium text-text-body-light transition-colors hover:border-accent-strong/40 hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:border-border-dark dark:bg-surface-card-dark dark:text-text-body-dark dark:hover:border-accent-primary/50 dark:hover:text-accent-primary dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark",
        showLabel ? "w-full" : "justify-center",
        className,
      )}
    >
      <motion.span
        aria-hidden="true"
        className="relative grid size-6 shrink-0 place-items-center"
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 220, damping: 16 }
        }
      >
        <AnimatePresence initial={false} mode="wait">
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.12 }}
              className="absolute grid place-items-center"
            >
              <Moon className="size-5" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.12 }}
              className="absolute grid place-items-center"
            >
              <Sun className="size-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>

      {showLabel ? (
        <span className="truncate">{isDark ? "Light mode" : "Dark mode"}</span>
      ) : null}
    </button>
  );
}
