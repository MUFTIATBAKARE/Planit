"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  Check,
  CircleCheck,
  CircleDashed,
  ListTodo,
  Trash,
  type LucideIcon,
} from "lucide-react";
import { TASK_RENAME_HINT_ID, TaskItem } from "@/components/tasks/TaskItem";
import type { Priority, Task, TaskFilter } from "@/lib/types";
import { cn } from "@/lib/utils";

type TaskEmptyState = {
  title: string;
  body: string;
  Icon: LucideIcon;
};

type TaskListProps = {
  tasks: Task[];
  /** The active tab, so the empty state can explain what is being filtered. */
  filter: TaskFilter;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onRename: (task: Task, title: string) => void;
  onPriorityChange: (task: Task, priority: Priority) => void;
  onDueDateChange: (task: Task, dueDate: string | null) => void;
  /** Opens the detail drawer — gated behind the paywall for guests. */
  onOpenDetails: (task: Task) => void;
  /** Flips `isArchived` — gated behind the paywall for guests. */
  onToggleArchive: (task: Task) => void;
  /** Marks every visible row complete / incomplete — gated for guests. */
  onToggleAll: (isCompleted: boolean) => void;
  /** How many visible rows are already complete (drives the master checkbox). */
  completedVisibleCount: number;
  /** Deletes every completed task — gated behind the paywall for guests. */
  onClearCompleted: () => void;
  /** Completed tasks across the whole workspace, for the button label. */
  completedCount: number;
  isClearingCompleted: boolean;
  /**
   * Copy to show instead of the tab's default empty state — used when a search
   * term or tag filter is what actually emptied the list.
   */
  emptyOverride?: TaskEmptyState;
};

const EMPTY_STATES: Record<
  TaskFilter,
  { title: string; body: string; Icon: LucideIcon }
> = {
  all: {
    title: "Your list is clear",
    body: "Add the first task above — it saves instantly and syncs everywhere.",
    Icon: ListTodo,
  },
  active: {
    title: "Nothing left to do",
    body: "Every task is complete. Add a new one whenever you are ready.",
    Icon: CircleCheck,
  },
  completed: {
    title: "No completed tasks yet",
    body: "Tick a task off and it appears here.",
    Icon: CircleDashed,
  },
  archived: {
    title: "Nothing archived",
    body: "Archive a task with the archive button on its row, and it will wait here out of the way.",
    Icon: Archive,
  },
};

/**
 * Live task list. Every mutation is wrapped in <AnimatePresence> and each row
 * carries the `layout` prop, so switching a filter glides the surviving rows
 * into their new positions instead of snapping.
 */
export function TaskList({
  tasks,
  filter,
  onToggle,
  onDelete,
  onRename,
  onPriorityChange,
  onDueDateChange,
  onOpenDetails,
  onToggleArchive,
  onToggleAll,
  completedVisibleCount,
  onClearCompleted,
  completedCount,
  isClearingCompleted,
  emptyOverride,
}: TaskListProps) {
  const shouldReduceMotion = useReducedMotion();
  const masterCheckboxRef = useRef<HTMLInputElement | null>(null);

  const visibleCount = tasks.length;
  const allVisibleComplete =
    visibleCount > 0 && completedVisibleCount === visibleCount;
  const isPartiallyComplete =
    completedVisibleCount > 0 && completedVisibleCount < visibleCount;

  /* The native checkbox exposes the mixed state to assistive tech, which is
     why the master toggle is a real <input> rather than an ARIA widget. */
  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isPartiallyComplete;
    }
  }, [isPartiallyComplete]);

  if (tasks.length === 0) {
    const { title, body, Icon } = emptyOverride ?? EMPTY_STATES[filter];

    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border-light bg-surface-card-light/60 px-6 py-14 text-center dark:border-border-dark dark:bg-surface-card-dark/60">
        <span
          aria-hidden="true"
          className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-strong dark:bg-accent-primary/15 dark:text-accent-primary"
        >
          <Icon className="size-6" />
        </span>
        <p className="text-base font-semibold text-text-header-light dark:text-text-header-dark">
          {title}
        </p>
        <p className="max-w-sm text-sm text-text-muted-light dark:text-text-muted-dark">
          {body}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ---- bulk action bar (V3) ---- */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border-light bg-surface-card-light px-3 py-2 shadow-card sm:mb-3 dark:border-border-dark dark:bg-surface-card-dark">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-full px-2 text-sm font-medium text-text-header-light dark:text-text-header-dark">
          <input
            ref={masterCheckboxRef}
            type="checkbox"
            className="peer sr-only"
            checked={allVisibleComplete}
            onChange={() => onToggleAll(!allVisibleComplete)}
            aria-label={
              allVisibleComplete
                ? `Mark all ${visibleCount} visible tasks as not completed`
                : `Mark all ${visibleCount} visible tasks as completed`
            }
          />

          <span
            aria-hidden="true"
            className={cn(
              "grid size-5 place-items-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent-strong peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-card-light dark:peer-focus-visible:ring-accent-primary dark:peer-focus-visible:ring-offset-surface-card-dark",
              allVisibleComplete
                ? "border-accent-primary bg-accent-primary text-accent-fg"
                : "border-border-light dark:border-border-dark",
            )}
          >
            <Check
              aria-hidden="true"
              strokeWidth={3}
              className={cn(
                "size-3 transition-opacity duration-150",
                allVisibleComplete ? "opacity-100" : "opacity-0",
              )}
            />
          </span>

          <span className="truncate">
            Select all {visibleCount} visible
          </span>
        </label>

        <button
          type="button"
          onClick={onClearCompleted}
          disabled={completedCount === 0 || isClearingCompleted}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full border border-border-light px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:border-border-dark",
            "text-danger hover:border-danger/50 hover:bg-danger/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:focus-visible:ring-offset-app-bg-dark",
          )}
        >
          <Trash aria-hidden="true" className="size-4" />
          Clear completed
          {completedCount > 0 ? (
            <span className="rounded-full bg-danger/15 px-1.5 text-xs font-bold tabular-nums">
              {completedCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Referenced by every row's Rename button (aria-describedby). */}
      <p id={TASK_RENAME_HINT_ID} className="sr-only">
        Double-click a task row, or use its Rename button, to edit the task
        name. Activating a row opens its details.
      </p>

      <motion.ul
        layout={!shouldReduceMotion}
        role="list"
        className="space-y-2 sm:space-y-3"
      >
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onRename={onRename}
              onPriorityChange={onPriorityChange}
              onDueDateChange={onDueDateChange}
              onOpenDetails={onOpenDetails}
              onToggleArchive={onToggleArchive}
            />
          ))}
        </AnimatePresence>
      </motion.ul>
    </>
  );
}
