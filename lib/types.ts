import type { Timestamp } from "firebase/firestore";

/** Upper bounds mirrored in firestore.rules and in the form controls. */
export const MAX_TITLE_LENGTH = 140;
export const MAX_DESCRIPTION_LENGTH = 2000;

/**
 * Priority levels are persisted as a string field (`priority`) so the value
 * stays readable inside the Firestore console and in the security rules.
 */
export type Priority = "low" | "medium" | "high";

/**
 * A task document stored in the top-level `tasks` collection.
 *
 * Documents are always queried with `where("userId", "==", user.uid)` so that
 * one account can never read or mutate another account's tasks.
 */
export type Task = {
  /** Firestore document id. */
  id: string;
  /** Owner uid — the security boundary for every read and write. */
  userId: string;
  /** Short, human readable task text. */
  title: string;
  /** Completion flag toggled from the task checkbox. */
  isCompleted: boolean;
  /** Persistent priority level, edited from the row's dropdown. */
  priority: Priority;
  /**
   * Optional calendar day stored as an ISO date string (`"YYYY-MM-DD"`).
   * A date-only string avoids the timezone drift a timestamp would introduce
   * for a native `<input type="date">`, and round-trips losslessly.
   */
  dueDate: string | null;
  /**
   * Long-form notes saved from the detail drawer (V3). `null` when untouched,
   * so a task with no notes costs nothing in the document.
   */
  description: string | null;
  /**
   * Custom category labels ("Work", "Personal", …) attached from the creation
   * bar or the detail drawer (V3). Always a de-duplicated list of short strings.
   */
  tags: string[];
  /**
   * Soft-hide flag flipped from the row's archive button (V3). Archived tasks
   * are excluded from the default views and reachable from the Archived toggle.
   */
  isArchived: boolean;
  /**
   * Auto-managed creation date written with `serverTimestamp()`.
   * `null` while a just-created document is still pending on the server.
   */
  createdAt: TaskTimestamp;
  /** Auto-managed update date written with `serverTimestamp()`. */
  updatedAt: TaskTimestamp;
};

/**
 * `serverTimestamp()` is a sentinel at write time and resolves to a
 * `Timestamp` on the server, so reads are normalised through this union.
 */
export type TaskTimestamp = Timestamp | Date | number | null;

/** Fields required to persist a brand new task. */
export type NewTaskInput = {
  title: string;
  userId: string;
  /** Defaults to `medium` when the composer is left untouched. */
  priority?: Priority;
  /** Defaults to `null` (no due date). */
  dueDate?: string | null;
  /** Defaults to `[]` (no tags). */
  tags?: string[];
};

/** Editable fields of an existing task. Only the keys sent are written. */
export type TaskPatch = {
  title?: string;
  priority?: Priority;
  dueDate?: string | null;
  description?: string | null;
  tags?: string[];
  isArchived?: boolean;
};

/**
 * Client-side list filters rendered as the tab bar above the task list.
 * `archived` is the V3 view that surfaces soft-hidden tasks.
 */
export type TaskFilter = "all" | "active" | "completed" | "archived";

/** Tabs rendered on the single-screen auth page. */
export type AuthMode = "signin" | "signup";
