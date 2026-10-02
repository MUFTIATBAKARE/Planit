"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Plus, Tag, X } from "lucide-react";
import {
  MAX_TAGS,
  MAX_TAG_LENGTH,
  addTag,
  normalizeTag,
  removeTag,
} from "@/lib/tags";
import { cn } from "@/lib/utils";

type TagInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  hideLabel?: boolean;
  className?: string;
  disabled?: boolean;
  /** Tags already in use elsewhere, offered as one-tap chips. */
  suggestions?: string[];
};

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card-light dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-surface-card-dark";

/**
 * Custom tag editor. Type and press Enter (or comma) to attach a tag;
 * Backspace on an empty field removes the last one. Every chip's remove button
 * carries its own descriptive `aria-label` so the list is fully keyboard
 * operable, and the applied tags are always rendered as text — never colour
 * alone.
 */
export function TagInput({
  tags,
  onChange,
  label = "Tags",
  hideLabel = true,
  className,
  disabled = false,
  suggestions = [],
}: TagInputProps) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const atLimit = tags.length >= MAX_TAGS;

  const commit = (raw: string) => {
    const next = addTag(tags, raw);
    setDraft("");
    if (next !== tags) onChange(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (draft.trim()) commit(draft);
      return;
    }

    if (event.key === "Backspace" && !draft && tags.length > 0) {
      event.preventDefault();
      onChange(removeTag(tags, tags[tags.length - 1]));
    }
  };

  const unusedSuggestions = suggestions.filter(
    (tag) =>
      !tags.some((applied) => applied.toLowerCase() === tag.toLowerCase()),
  );

  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>

      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-1.5 rounded-full border border-border-light bg-surface-card-light px-2 py-1.5 transition-colors focus-within:border-accent-strong dark:border-border-dark dark:bg-surface-card-dark",
          disabled && "opacity-60",
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pl-2.5 pr-1 text-xs font-semibold text-accent-strong dark:bg-accent-primary/15 dark:text-accent-primary"
          >
            <Tag aria-hidden="true" className="size-3" />
            {tag}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(removeTag(tags, tag))}
              aria-label={`Remove tag: ${tag}`}
              className={cn(
                "grid size-6 place-items-center rounded-full transition-colors hover:bg-accent-strong/15 disabled:cursor-not-allowed",
                FOCUS,
              )}
            >
              <X aria-hidden="true" className="size-3" />
            </button>
          </span>
        ))}

        <input
          id={id}
          value={draft}
          disabled={disabled || atLimit}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim() && !atLimit) commit(draft);
          }}
          maxLength={MAX_TAG_LENGTH}
          placeholder={
            atLimit ? `Up to ${MAX_TAGS} tags` : "Add a tag…"
          }
          aria-describedby={`${id}-hint`}
          className={cn(
            "min-w-24 flex-1 bg-transparent px-1 py-1 text-sm text-text-header-light placeholder:text-text-muted-light focus-visible:outline-none disabled:cursor-not-allowed dark:text-text-header-dark dark:placeholder:text-text-muted-dark",
          )}
        />
      </div>

      <p id={`${id}-hint`} className="mt-1 text-xs text-text-muted-light dark:text-text-muted-dark">
        Press Enter to add. Up to {MAX_TAGS} tags, {MAX_TAG_LENGTH} characters each.
      </p>

      {unusedSuggestions.length > 0 && !atLimit ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
            Suggestions:
          </span>
          {unusedSuggestions.slice(0, 6).map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => commit(normalizeTag(tag))}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border border-border-light px-2.5 py-1 text-xs font-medium text-text-body-light transition-colors hover:border-accent-strong/50 hover:text-accent-strong disabled:cursor-not-allowed dark:border-border-dark dark:text-text-body-dark dark:hover:border-accent-primary/60 dark:hover:text-accent-primary",
                FOCUS,
              )}
            >
              <Plus aria-hidden="true" className="size-3" />
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}