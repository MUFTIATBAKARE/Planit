import type { Task } from "./types";

/**
 * Tag limits (V3). Kept in one place so the composer, the drawer and the
 * Firestore rules all agree on what a legal tag list looks like.
 */
export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 24;

/** Trims, collapses inner whitespace and clamps a single tag string. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
}

/**
 * Turns any stored value into a clean tag list: strings only, trimmed,
 * case-insensitively de-duplicated, capped at `MAX_TAGS`.
 * Tolerates documents written before V3 (which carry no `tags` key at all).
 */
export function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const tags: string[] = [];

  for (const value of raw) {
    if (typeof value !== "string") continue;

    const tag = normalizeTag(value);
    if (!tag) continue;
    if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      continue;
    }

    tags.push(tag);
    if (tags.length >= MAX_TAGS) break;
  }

  return tags;
}

/** Appends one typed tag, respecting the limit and de-duplication. */
export function addTag(tags: string[], raw: string): string[] {
  const next = normalizeTags([...tags, raw]);
  return next.length === tags.length && next.every((t, i) => t === tags[i])
    ? tags
    : next;
}

/** Removes one tag (case-insensitive) from the list. */
export function removeTag(tags: string[], tag: string): string[] {
  return tags.filter((existing) => existing !== tag);
}

/**
 * Every distinct tag currently in use, alphabetically — the source for the
 * quick tag-filter pills. Archived rows are skipped so the pill row matches
 * what the default view can offer.
 */
export function collectTags(tasks: Task[]): string[] {
  const seen = new Map<string, string>();

  for (const task of tasks) {
    if (task.isArchived) continue;

    for (const tag of task.tags) {
      const key = tag.toLowerCase();
      if (!seen.has(key)) seen.set(key, tag);
    }
  }

  return [...seen.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}