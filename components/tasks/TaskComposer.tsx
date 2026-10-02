"use client";

import { useState, type FormEvent } from "react";
import { Lock, Plus, Tag } from "lucide-react";
import { DueDateField } from "@/components/tasks/DueDateField";
import { PrioritySelect } from "@/components/tasks/PrioritySelect";
import { TagInput } from "@/components/tasks/TagInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEFAULT_PRIORITY } from "@/lib/priority";
import { createTask } from "@/lib/tasks";
import type { NewTaskInput, Priority } from "@/lib/types";

/**
 * Fast capture bar. Pressing Enter — or the button — writes the task straight
 * to Firestore with addDoc(), and the onSnapshot listener renders it instantly.
 *
 * The priority dropdown and the native date picker travel with the same submit,
 * so a task can be captured with its level and deadline in a single keystroke,
 * and the bar resets to its defaults afterwards.
 */
export function TaskComposer({
  userId,
  tagSuggestions = [],
  onCreate,
  isTagsLocked = false,
  onTagsLockedClick,
}: {
  userId: string;
  /** Tags already in use elsewhere, offered as one-tap chips. */
  tagSuggestions?: string[];
  /**
   * Persistence hook. Defaults to a Firestore `addDoc`; Guest Mode injects a
   * local-storage writer instead, so no network write is ever attempted.
   */
  onCreate?: (input: NewTaskInput) => Promise<void>;
  /** Guests cannot attach tags — the control becomes a paywall trigger. */
  isTagsLocked?: boolean;
  onTagsLockedClick?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>(DEFAULT_PRIORITY);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Firestore by default; Guest Mode injects a local writer via `onCreate`, so
     a guest submission can never reach addDoc. */
  const persist =
    onCreate ??
    ((input: NewTaskInput) => createTask(input).then(() => undefined));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      await persist({ title: trimmedTitle, userId, priority, dueDate, tags });
      setTitle("");
      setPriority(DEFAULT_PRIORITY);
      setDueDate(null);
      setTags([]);
    } catch {
      setError("Could not save that task. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-panel border border-border-light bg-surface-card-light p-3 shadow-card dark:border-border-dark dark:bg-surface-card-dark">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            label="New task"
            hideLabel
            name="title"
            placeholder="What needs to happen next?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={140}
            autoComplete="off"
            className="sm:flex-1"
          />

          <Button
            type="submit"
            size="md"
            isLoading={isSaving}
            className="w-full sm:w-auto"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add task
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-start gap-2">
          <PrioritySelect
            value={priority}
            onChange={setPriority}
            size="md"
            label="Priority for the new task"
            className="w-36 shrink-0"
          />

          <DueDateField
            value={dueDate}
            onChange={setDueDate}
            size="md"
            label="Due date for the new task"
            className="w-44 shrink-0"
          />
        </div>

        {isTagsLocked ? (
          <button
            type="button"
            onClick={onTagsLockedClick}
            className="mt-3 flex min-h-11 w-full items-center gap-2 rounded-full border border-dashed border-border-light px-4 text-left text-sm text-text-muted-light transition-colors hover:border-accent-strong/50 hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:border-border-dark dark:text-text-muted-dark dark:hover:border-accent-primary/60 dark:hover:text-accent-primary dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark"
          >
            <Tag aria-hidden="true" className="size-4 shrink-0" />
            Add tags — available on a free account
            <Lock aria-hidden="true" className="ml-auto size-3.5 shrink-0" />
          </button>
        ) : (
          <TagInput
            tags={tags}
            onChange={setTags}
            suggestions={tagSuggestions}
            className="mt-3"
          />
        )}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-card border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
