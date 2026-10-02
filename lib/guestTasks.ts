import { DEFAULT_PRIORITY, isPriority } from "./priority";
import { MAX_TITLE_LENGTH } from "./types";
import type { Task, TaskPatch, TaskTimestamp } from "./types";

/**
 * Guest Mode persistence (V3).
 *
 * A guest session is *never* allowed to touch Firestore — every helper in this
 * module works on a plain client-side array that is mirrored into
 * `localStorage`. The synthetic `userId` below keeps a guest task structurally
 * identical to a stored one, so the same components render both.
 */
export const GUEST_USER_ID = "guest";
export const GUEST_STORAGE_KEY = "planit-guest-tasks";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Monotonic counter so two tasks created in the same millisecond still sort. */
let sequence = 0;

function createGuestId(): string {
  sequence += 1;

  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `guest-${crypto.randomUUID()}`;
  }

  return `guest-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

function toDueDate(value: unknown): string | null {
  return typeof value === "string" && ISO_DATE_PATTERN.test(value) ? value : null;
}

function toTimestamp(value: unknown, fallback: number): TaskTimestamp {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Rebuilds one task from untrusted localStorage JSON. */
function toGuestTask(value: unknown): Task | null {
  if (typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : createGuestId();
  const title = typeof record.title === "string" ? record.title : "";

  if (!title.trim()) return null;

  return {
    id,
    userId: GUEST_USER_ID,
    title: title.slice(0, MAX_TITLE_LENGTH),
    isCompleted: Boolean(record.isCompleted),
    priority: isPriority(record.priority) ? record.priority : DEFAULT_PRIORITY,
    dueDate: toDueDate(record.dueDate),
    // V3-only fields are intentionally inert for guests.
    description: null,
    tags: [],
    isArchived: false,
    createdAt: toTimestamp(record.createdAt, Date.now()),
    updatedAt: toTimestamp(record.updatedAt, Date.now()),
  };
}

/** Reads the persisted guest list, discarding anything malformed. */
export function readGuestTasks(): Task[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(toGuestTask)
      .filter((task): task is Task => task !== null);
  } catch {
    // Corrupt JSON or blocked storage: start from a clean slate.
    return [];
  }
}

/** Persists the guest list. Blocked storage simply no-ops. */
export function writeGuestTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Private mode / quota: the in-memory list keeps working for this session.
  }
}

/** Removes every trace of the guest list. */
export function clearGuestTasks(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

export type GuestTaskInput = {
  title: string;
  priority?: Task["priority"];
  dueDate?: string | null;
};

/** Builds a brand new guest task at the head of the list. */
export function createGuestTask({
  title,
  priority,
  dueDate,
}: GuestTaskInput): Task {
  const now = Date.now();

  return {
    id: createGuestId(),
    userId: GUEST_USER_ID,
    title: title.trim().slice(0, MAX_TITLE_LENGTH),
    isCompleted: false,
    priority: priority ?? DEFAULT_PRIORITY,
    dueDate: dueDate ?? null,
    description: null,
    tags: [],
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Applies a partial edit locally, mirroring the Firestore `patchTask` rules. */
export function patchGuestTask(
  tasks: Task[],
  taskId: string,
  patch: TaskPatch,
): Task[] {
  return tasks.map((task) => {
    if (task.id !== taskId) return task;

    return {
      ...task,
      title:
        patch.title !== undefined
          ? patch.title.trim().slice(0, MAX_TITLE_LENGTH)
          : task.title,
      priority: patch.priority ?? task.priority,
      dueDate: patch.dueDate !== undefined ? patch.dueDate : task.dueDate,
      updatedAt: Date.now(),
    };
  });
}

/** Flips completion for a single guest task. */
export function toggleGuestTask(tasks: Task[], taskId: string): Task[] {
  return tasks.map((task) =>
    task.id === taskId
      ? { ...task, isCompleted: !task.isCompleted, updatedAt: Date.now() }
      : task,
  );
}

/** Removes a single guest task. */
export function removeGuestTask(tasks: Task[], taskId: string): Task[] {
  return tasks.filter((task) => task.id !== taskId);
}