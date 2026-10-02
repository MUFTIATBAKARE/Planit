"use client";

import { useRef, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TaskFilter } from "@/lib/types";

export type TaskFilterTab = {
  id: TaskFilter;
  label: string;
  count: number;
};

type TaskFilterTabsProps = {
  value: TaskFilter;
  onChange: (next: TaskFilter) => void;
  tabs: readonly TaskFilterTab[];
  /** Prefix for the generated `tab` / `tabpanel` ids. */
  idBase: string;
};

/**
 * All / Active / Completed tab bar.
 *
 * Implements the WAI-ARIA tabs pattern (roving tabindex + arrow/Home/End keys)
 * and slides a single Framer Motion indicator between tabs with `layoutId`, so
 * switching filters glides instead of snapping.
 */
export function TaskFilterTabs({
  value,
  onChange,
  tabs,
  idBase,
}: TaskFilterTabsProps) {
  const shouldReduceMotion = useReducedMotion();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const lastIndex = tabs.length - 1;
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
    else if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = lastIndex;
    else return;

    event.preventDefault();
    onChange(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Filter tasks"
      className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-border-light bg-surface-card-light p-1 shadow-card [-mx-1] [scrollbar-width:none] sm:mx-0 sm:inline-flex sm:w-auto sm:flex-wrap sm:overflow-visible dark:border-border-dark dark:bg-surface-card-dark [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === value;

        return (
          <button
            key={tab.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${idBase}-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`${idBase}-panel`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light sm:px-4 dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark",
              isActive
                ? "text-accent-fg"
                : "text-text-muted-light hover:text-text-header-light dark:text-text-muted-dark dark:hover:text-text-header-dark",
            )}
          >
            {isActive ? (
              <motion.span
                aria-hidden="true"
                layoutId={`${idBase}-indicator`}
                className="absolute inset-0 rounded-full bg-accent-strong"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 380, damping: 32 }
                }
              />
            ) : null}

            <span className="relative z-10 truncate">{tab.label}</span>

            <span
              className={cn(
                "relative z-10 rounded-full px-1.5 text-xs font-bold tabular-nums",
                isActive
                  ? "bg-accent-fg/25 text-accent-fg"
                  : "bg-border-light text-text-body-light dark:bg-border-dark dark:text-text-body-dark",
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
