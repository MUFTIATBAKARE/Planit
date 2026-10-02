import type { TaskTimestamp } from "./types";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Tiny class-name joiner (keeps the bundle free of extra dependencies). */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

function toDate(value: TaskTimestamp): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate();
  }
  return null;
}

/**
 * Formats a Firestore timestamp for the task row.
 * Pending local writes (server timestamp not yet acknowledged) read "Just now".
 */
export function formatTaskTimestamp(
  value: TaskTimestamp,
  now: number = Date.now(),
): string {
  const date = toDate(value);
  if (!date) return "Just now";

  const diff = now - date.getTime();
  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/** ISO string for the `<time datetime>` attribute, when a date is available. */
export function toIsoString(value: TaskTimestamp): string | undefined {
  return toDate(value)?.toISOString();
}

/* ==========================================================================
 * Due dates (V2)
 * Stored as a date-only ISO string ("YYYY-MM-DD") so a native
 * <input type="date"> round-trips exactly and no timezone shift can move a
 * task to an adjacent day.
 * ========================================================================== */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Parses "YYYY-MM-DD" into a *local* midnight Date, or null when invalid. */
export function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Today as "YYYY-MM-DD" in the visitor's own timezone. */
export function todayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export type DueDateState = {
  /** Human copy, e.g. "Due today" or "Overdue by 2 days". */
  label: string;
  isOverdue: boolean;
  isToday: boolean;
};

/**
 * Turns a stored due date into copy plus flags. The overdue state is always
 * rendered as a written label, never as colour on its own.
 */
export function getDueDateState(
  value: string | null,
  now: Date = new Date(),
): DueDateState | null {
  if (!value) return null;

  const due = parseIsoDate(value);
  const today = parseIsoDate(todayIsoDate(now));
  if (!due || !today) return null;

  const days = Math.round((due.getTime() - today.getTime()) / DAY);

  if (days === 0) return { label: "Due today", isOverdue: false, isToday: true };
  if (days === 1) return { label: "Due tomorrow", isOverdue: false, isToday: false };
  if (days === -1) return { label: "Overdue by 1 day", isOverdue: true, isToday: false };
  if (days < -1) {
    return {
      label: `Overdue by ${Math.abs(days)} days`,
      isOverdue: true,
      isToday: false,
    };
  }

  return {
    label: `Due ${new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
    }).format(due)}`,
    isOverdue: false,
    isToday: false,
  };
}

/** Produces up-to-two letter initials for the profile chip. */
export function initialsOf(user: { displayName?: string | null; email?: string | null }): string {
  const source = user.displayName?.trim() || user.email?.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
