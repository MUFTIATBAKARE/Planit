"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlarmClock,
  Archive,
  ArchiveRestore,
  Check,
  Clock,
  NotebookPen,
  Pencil,
  Tag,
  Trash,
} from "lucide-react";
import { DueDateField } from "@/components/tasks/DueDateField";
import { PrioritySelect } from "@/components/tasks/PrioritySelect";
import { PRIORITY_META } from "@/lib/priority";
import type { Priority, Task } from "@/lib/types";
import {
  cn,
  formatTaskTimestamp,
  getDueDateState,
  toIsoString,
} from "@/lib/utils";

/**
 * Screen-reader hint rendered once per list (see TaskList) and referenced by
 * every row's title button, so keyboard users discover the rename shortcut.
 */
export const TASK_RENAME_HINT_ID = "task-rename-hint";

/**
 * Single click opens the detail drawer, double click renames. Because the
 * browser fires `click` twice before `dblclick`, the drawer open is deferred by
 * this beat so a double-click can cancel it — otherwise double-clicking a row
 * would flash the drawer open before the editor appears.
 */
const ROW_CLICK_DELAY = 220;

/**
 * Shared 44px icon-button shell for the row's secondary actions, so Details,
 * Rename and Archive all meet the mobile touch-target minimum.
 */
const ACTION_BUTTON =
  "grid size-11 shrink-0 place-items-center rounded-full text-text-muted-light transition-colors hover:bg-app-bg-light hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card-light dark:text-text-muted-dark dark:hover:bg-app-bg-dark dark:hover:text-accent-primary dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-surface-card-dark";

type TaskItemProps = {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onRename: (task: Task, title: string) => void;
  onPriorityChange: (task: Task, priority: Priority) => void;
  onDueDateChange: (task: Task, dueDate: string | null) => void;
  /** Opens the detail drawer — gated behind the paywall for guests. */
  onOpenDetails: (task: Task) => void;
  /** Flips the `isArchived` flag — gated behind the paywall for guests. */
  onToggleArchive: (task: Task) => void;
};

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onRename,
  onPriorityChange,
  onDueDateChange,
  onOpenDetails,
  onToggleArchive,
}: TaskItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const skipCommitRef = useRef(false);
  const clickTimerRef = useRef<number | null>(null);

  const createdAtIso = toIsoString(task.createdAt);
  const priority = PRIORITY_META[task.priority];
  const due = getDueDateState(task.dueDate);

  /* Focus and select the whole title so renaming is one keystroke away. */
  useEffect(() => {
    if (!isEditing) return;

    skipCommitRef.current = false;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  /* Drop a pending drawer open if the row unmounts first (filter change, or the
     task being deleted). */
  useEffect(() => {
    return () => {
      if (clickTimerRef.current !== null) {
        window.clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    };
  }, []);

  const startEditing = () => {
    setDraft(task.title);
    setIsEditing(true);
  };

  /* Enter or blur commits. Escape discards, and must not be committed by the
     blur that can follow the unmount — hence the skip flag. */
  const commit = () => {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
      return;
    }

    const next = draft.trim();
    setIsEditing(false);
    if (!next || next === task.title) return;

    onRename(task, next);
  };

  const cancel = () => {
    skipCommitRef.current = true;
    setIsEditing(false);
  };

  /* Inline rename is reachable from the row's Rename button, or by
     double-clicking anywhere on the row. */
  const handleEditorKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  };

  /*
   * Single click anywhere on the row opens the detail drawer; a double-click
   * starts the inline rename. Every interactive control below stops
   * propagation, so the checkbox, selects and action buttons keep their own
   * behaviour and the row handler never fires for them.
   */
  const handleRowClick = () => {
    if (isEditing) return;

    /* Second click of a pair: let the dblclick handler win. */
    if (clickTimerRef.current !== null) return;

    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      onOpenDetails(task);
    }, ROW_CLICK_DELAY);
  };

  const handleRowDoubleClick = () => {
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    if (isEditing) return;
    startEditing();
  };

  /* 100ms fade used by the text ⇄ input morph. */
  const morph = { duration: shouldReduceMotion ? 0 : 0.1 };

  return (
    <motion.li
      layout={!shouldReduceMotion}
      onClick={handleRowClick}
      onDoubleClick={handleRowDoubleClick}
      initial={{ opacity: 0, height: 0, y: shouldReduceMotion ? 0 : -10 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{
        opacity: 0,
        scale: 0.96,
        height: 0,
        transition: {
          duration: shouldReduceMotion ? 0 : 0.15,
          ease: "easeIn",
        },
      }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="cursor-pointer rounded-card border border-border-light bg-surface-card-light p-2 shadow-card transition-shadow hover:shadow-card-hover sm:p-2.5 dark:border-border-dark dark:bg-surface-card-dark">
        <div className="flex items-start gap-1 sm:gap-2">
          {/* Native checkbox keeps aria-checked semantics and keyboard support. */}
          <label
            onClick={(event) => event.stopPropagation()}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full"
          >
            <input
              type="checkbox"
              className="peer sr-only"
              checked={task.isCompleted}
              onChange={() => onToggle(task)}
              aria-label={
                task.isCompleted
                  ? `Mark "${task.title}" as not completed`
                  : `Mark "${task.title}" as completed`
              }
            />
            <span
              aria-hidden="true"
              className={cn(
                "grid size-6 place-items-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent-strong peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-card-light dark:peer-focus-visible:ring-accent-primary dark:peer-focus-visible:ring-offset-surface-card-dark",
                task.isCompleted
                  ? "border-accent-primary bg-accent-primary text-accent-fg"
                  : "border-border-light dark:border-border-dark",
              )}
            >
              <Check
                className={cn(
                  "size-3.5 transition-opacity duration-150",
                  task.isCompleted ? "opacity-100" : "opacity-0",
                )}
                strokeWidth={3}
              />
            </span>
          </label>

          <div className="min-w-0 flex-1">
            {/* ---- title: text ⇄ input morph ---- */}
            <div className="relative">
              <AnimatePresence initial={false} mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editor"
                    onClick={(event) => event.stopPropagation()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={morph}
                  >
                    <input
                      ref={inputRef}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onBlur={commit}
                      onKeyDown={handleEditorKeyDown}
                      maxLength={140}
                      aria-label={`Edit title for task: ${task.title}`}
                      className="h-11 w-full rounded-full border border-accent-strong/60 bg-app-bg-light px-3.5 text-sm font-medium text-text-header-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card-light dark:bg-app-bg-dark dark:text-text-header-dark dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-surface-card-dark"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="title"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={morph}
                  >
                    <div
                      title="Click to open details · double-click to rename"
                      className="flex min-h-11 w-full items-center rounded-lg px-1 text-left"
                    >
                      <span className="relative block min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-medium transition-colors duration-200 sm:text-base",
                            task.isCompleted
                              ? "text-text-muted-light dark:text-text-muted-dark"
                              : "text-text-header-light dark:text-text-header-dark",
                          )}
                        >
                          {task.title}
                        </span>

                        {/* Strike-through that slices across the label on completion. */}
                        <motion.span
                          aria-hidden="true"
                          className="pointer-events-none absolute left-0 top-1/2 h-[1.5px] w-full origin-left bg-text-muted-light dark:bg-text-muted-dark"
                          initial={false}
                          animate={{ scaleX: task.isCompleted ? 1 : 0 }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 0.18,
                            ease: "easeOut",
                          }}
                        />
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ---- meta: priority label, due date copy, creation time ---- */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium",
                  priority.chipClassName,
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("size-2 rounded-full", priority.dotClassName)}
                />
                {priority.label} priority
              </span>

              {task.isArchived ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border-light px-2 py-0.5 font-medium text-text-muted-light dark:border-border-dark dark:text-text-muted-dark">
                  <Archive aria-hidden="true" className="size-3" />
                  Archived
                </span>
              ) : null}

              {task.tags.length > 0 ? (
                <span className="inline-flex flex-wrap items-center gap-1">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent-strong dark:bg-accent-primary/15 dark:text-accent-primary"
                    >
                      <Tag aria-hidden="true" className="size-2.5" />
                      {tag}
                    </span>
                  ))}
                </span>
              ) : null}

              {task.description ? (
                <span className="inline-flex items-center gap-1 font-medium text-text-muted-light dark:text-text-muted-dark">
                  <NotebookPen aria-hidden="true" className="size-3" />
                  Has notes
                </span>
              ) : null}

              {due ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-medium",
                    due.isOverdue
                      ? "text-danger"
                      : "text-text-muted-light dark:text-text-muted-dark",
                  )}
                >
                  <AlarmClock aria-hidden="true" className="size-3" />
                  {due.label}
                </span>
              ) : null}

              <span className="inline-flex items-center gap-1 text-text-muted-light dark:text-text-muted-dark">
                <Clock aria-hidden="true" className="size-3" />
                <time dateTime={createdAtIso}>
                  {formatTaskTimestamp(task.createdAt)}
                </time>
              </span>
            </div>

            {/* ---- row controls: priority dropdown + due date picker ----
                 The container swallows the click so using a select, the date
                 picker, or any action button never also opens the drawer. */}
            <div
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
              className="mt-2 flex flex-wrap items-start gap-2 px-1"
            >
              <PrioritySelect
                value={task.priority}
                onChange={(next) => onPriorityChange(task, next)}
                size="sm"
                label={`Priority for task: ${task.title}`}
                className="w-32 shrink-0"
              />

              <DueDateField
                value={task.dueDate}
                onChange={(next) => onDueDateChange(task, next)}
                size="sm"
                label={`Due date for task: ${task.title}`}
              />

              {/* Secondary row actions. They wrap onto their own line on
                  mobile, which keeps the 44px targets without squeezing the
                  title. */}
              <span className="inline-flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onOpenDetails(task)}
                  aria-label={`Open details for task: ${task.title}`}
                  title="Open details"
                  className={ACTION_BUTTON}
                >
                  <NotebookPen aria-hidden="true" className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={startEditing}
                  aria-describedby={TASK_RENAME_HINT_ID}
                  aria-label={`Rename task: ${task.title}`}
                  title="Rename"
                  className={ACTION_BUTTON}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onToggleArchive(task)}
                  aria-pressed={task.isArchived}
                  aria-label={
                    task.isArchived
                      ? `Restore task from archive: ${task.title}`
                      : `Archive task: ${task.title}`
                  }
                  title={task.isArchived ? "Restore from archive" : "Archive"}
                  className={ACTION_BUTTON}
                >
                  {task.isArchived ? (
                    <ArchiveRestore aria-hidden="true" className="size-4" />
                  ) : (
                    <Archive aria-hidden="true" className="size-4" />
                  )}
                </button>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(task);
            }}
            aria-label={`Delete task: ${task.title}`}
            className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted-light transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card-light dark:text-text-muted-dark dark:focus-visible:ring-offset-surface-card-dark"
          >
            <Trash aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </motion.li>

  );
}
