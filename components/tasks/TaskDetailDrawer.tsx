"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlarmClock, CalendarDays, Flag, NotebookPen, X } from "lucide-react";
import { TagInput } from "@/components/tasks/TagInput";
import { Button } from "@/components/ui/Button";
import { PRIORITY_META } from "@/lib/priority";
import { MAX_DESCRIPTION_LENGTH } from "@/lib/types";
import type { Task } from "@/lib/types";
import { cn, formatTaskTimestamp, getDueDateState } from "@/lib/utils";

type TaskDetailDrawerProps = {
  /** The task to inspect, or `null` when the drawer is closed. */
  task: Task | null;
  onClose: () => void;
  onDescriptionSave: (task: Task, description: string | null) => void;
  onTagsChange: (task: Task, tags: string[]) => void;
  /** Tags already in use elsewhere, offered as one-tap suggestions. */
  tagSuggestions?: string[];
};

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card-light dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-surface-card-dark";

/**
 * Collapsible task detail drawer (V3).
 *
 * Slides in from the right edge (`x: 100%` → `x: 0%`) with an ease-out
 * transform, and mirrors the navigation drawer's keyboard contract: `role`
 * of dialog, `aria-modal`, focus moved into the panel on open and restored to
 * the originating row on close, Escape-to-close, and a body scroll lock.
 *
 * The focus effect keys on `task.id` (not the task object) on purpose — a
 * Firestore snapshot replaces the object on every write, and re-running the
 * effect then would yank focus away from whatever the user was editing.
 */
export function TaskDetailDrawer({
  task,
  onClose,
  onDescriptionSave,
  onTagsChange,
  tagSuggestions = [],
}: TaskDetailDrawerProps) {
  const shouldReduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const taskId = task?.id ?? null;

  useEffect(() => {
    if (!taskId) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Land on the notes field, which is the drawer's primary control.
    const notesField = panelRef.current?.querySelector<HTMLElement>("textarea");
    (notesField ?? closeButtonRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [taskId, onClose]);

  return (
    <AnimatePresence>
      {task ? (
        <motion.div
          key="task-detail"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.2,
            ease: "easeOut",
          }}
          className="fixed inset-0 z-50"
        >
          <div
            aria-hidden="true"
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/50"
          />

          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-detail-title"
            initial={{ x: shouldReduceMotion ? 0 : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: shouldReduceMotion ? 0 : "100%" }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.28,
              ease: "easeOut",
            }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border-light bg-surface-card-light shadow-card-hover dark:border-border-dark dark:bg-surface-card-dark"
          >
            <header className="flex items-start justify-between gap-3 border-b border-border-light p-5 dark:border-border-dark">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
                  Task details
                </p>
                <h2
                  id="task-detail-title"
                  className="mt-1 line-clamp-2 text-lg font-semibold text-text-header-light dark:text-text-header-dark"
                >
                  {task.title}
                </h2>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close task details"
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-full text-text-muted-light transition-colors hover:bg-app-bg-light hover:text-text-header-light dark:text-text-muted-dark dark:hover:bg-app-bg-dark dark:hover:text-text-header-dark",
                  FOCUS,
                )}
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
              <DrawerBody
                key={task.id}
                task={task}
                onDescriptionSave={onDescriptionSave}
                onTagsChange={onTagsChange}
                tagSuggestions={tagSuggestions}
              />
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type DrawerBodyProps = {
  task: Task;
  onDescriptionSave: (task: Task, description: string | null) => void;
  onTagsChange: (task: Task, tags: string[]) => void;
  tagSuggestions: string[];
};

/**
 * The drawer's editable body.
 *
 * Mounted with `key={task.id}` by the parent, so opening a different task
 * remounts this component and the notes draft resets itself — no effect-based
 * state synchronisation (and therefore no `set-state-in-effect` lint hit).
 */
function DrawerBody({
  task,
  onDescriptionSave,
  onTagsChange,
  tagSuggestions,
}: DrawerBodyProps) {
  const [draft, setDraft] = useState(task.description ?? "");
  const [justSaved, setJustSaved] = useState(false);

  const stored = task.description ?? "";
  const isDirty = draft.trim() !== stored.trim();
  const priority = PRIORITY_META[task.priority];
  const due = getDueDateState(task.dueDate);

  /* The live region reports one of three states; never colour alone. */
  let status = `${draft.length}/${MAX_DESCRIPTION_LENGTH} characters`;
  if (isDirty) status = "Unsaved changes";
  else if (justSaved) status = "Notes saved";

  const handleSave = () => {
    const next = draft.trim();
    onDescriptionSave(task, next ? next : null);
    setJustSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="task-description"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark"
        >
          Notes &amp; description
        </label>

        <textarea
          id="task-description"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setJustSaved(false);
          }}
          maxLength={MAX_DESCRIPTION_LENGTH}
          rows={8}
          placeholder="Add the detail that does not fit in the title — links, context, acceptance criteria…"
          className={cn(
            "w-full resize-y rounded-card border border-border-light bg-app-bg-light p-3 text-sm text-text-header-light transition-colors placeholder:text-text-muted-light focus-visible:border-accent-strong dark:border-border-dark dark:bg-app-bg-dark dark:text-text-header-dark dark:placeholder:text-text-muted-dark",
            FOCUS,
          )}
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p
            aria-live="polite"
            className="text-xs text-text-muted-light dark:text-text-muted-dark"
          >
            {status}
          </p>

          <Button size="sm" onClick={handleSave} disabled={!isDirty}>
            <NotebookPen aria-hidden="true" className="size-4" />
            Save notes
          </Button>
        </div>
      </div>

      <TagInput
        tags={task.tags}
        onChange={(tags) => onTagsChange(task, tags)}
        suggestions={tagSuggestions}
        hideLabel={false}
      />

      <dl className="space-y-3 rounded-card border border-border-light p-4 text-sm dark:border-border-dark">
        <div className="flex items-center justify-between gap-3">
          <dt className="inline-flex items-center gap-2 text-text-muted-light dark:text-text-muted-dark">
            <Flag aria-hidden="true" className="size-4" />
            Priority
          </dt>
          <dd>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                priority.chipClassName,
              )}
            >
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", priority.dotClassName)}
              />
              {priority.label}
            </span>
          </dd>
        </div>

        <div className="flex items-center justify-between gap-3">
          <dt className="inline-flex items-center gap-2 text-text-muted-light dark:text-text-muted-dark">
            <AlarmClock aria-hidden="true" className="size-4" />
            Due date
          </dt>
          <dd
            className={cn(
              "font-medium",
              due?.isOverdue
                ? "text-danger"
                : "text-text-header-light dark:text-text-header-dark",
            )}
          >
            {due?.label ?? "No due date"}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-3">
          <dt className="inline-flex items-center gap-2 text-text-muted-light dark:text-text-muted-dark">
            <CalendarDays aria-hidden="true" className="size-4" />
            Created
          </dt>
          <dd className="font-medium text-text-header-light dark:text-text-header-dark">
            {formatTaskTimestamp(task.createdAt)}
          </dd>
        </div>
      </dl>
    </div>
  );
}