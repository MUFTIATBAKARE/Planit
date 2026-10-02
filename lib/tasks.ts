import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_PRIORITY, isPriority } from "./priority";
import { normalizeTags } from "./tags";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "./types";
import type {
  NewTaskInput,
  Priority,
  Task,
  TaskPatch,
  TaskTimestamp,
} from "./types";

export const TASKS_COLLECTION = "tasks";

/**
 * Firestore caps a batch at 500 operations; bulk actions are chunked well
 * below that so a single bad write can be retried without redoing everything.
 */
const BATCH_LIMIT = 400;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Reads a stored due date, tolerating documents written before V2. */
function toDueDate(value: unknown): string | null {
  return typeof value === "string" && ISO_DATE_PATTERN.test(value)
    ? value
    : null;
}

/** Reads a stored description, tolerating documents written before V3. */
function toDescription(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const description = value.trim();
  return description ? description.slice(0, MAX_DESCRIPTION_LENGTH) : null;
}

function toTask(snapshot: QueryDocumentSnapshot<DocumentData>): Task {
  // `estimate` keeps a just-added task's date non-null before the server ack,
  // so the UI never flickers between a date and "Just now".
  const data = snapshot.data({ serverTimestamps: "estimate" });

  return {
    id: snapshot.id,
    userId: (data.userId as string) ?? "",
    title: (data.title as string) ?? "",
    isCompleted: Boolean(data.isCompleted),
    // Documents created before V2 carry no priority field: default to medium.
    priority: isPriority(data.priority) ? data.priority : DEFAULT_PRIORITY,
    dueDate: toDueDate(data.dueDate),
    // Documents created before V3 carry none of these fields.
    description: toDescription(data.description),
    tags: normalizeTags(data.tags),
    isArchived: Boolean(data.isArchived),
    createdAt: (data.createdAt as TaskTimestamp) ?? null,
    updatedAt: (data.updatedAt as TaskTimestamp) ?? null,
  };
}

function timestampToMillis(value: TaskTimestamp): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  return 0;
}

/** Newest first — tolerant of pending server timestamps. */
function sortNewestFirst(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt),
  );
}

/**
 * Persists a new task with an auto-managed `serverTimestamp()`, plus the V2
 * `priority` / `dueDate` and the V3 `tags` captured in the creation bar.
 */
export async function createTask({
  title,
  userId,
  priority,
  dueDate,
  tags,
}: NewTaskInput): Promise<string> {
  const reference = await addDoc(collection(db, TASKS_COLLECTION), {
    title: title.trim().slice(0, MAX_TITLE_LENGTH),
    userId,
    isCompleted: false,
    priority: priority ?? DEFAULT_PRIORITY,
    dueDate: dueDate ?? null,
    description: null,
    tags: normalizeTags(tags),
    isArchived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return reference.id;
}

/**
 * Single writer for the editable title / priority / due date fields. Only the
 * keys present in `patch` are sent, so a title edit can never clobber a due
 * date written a moment earlier in another tab.
 */
async function patchTask(taskId: string, patch: TaskPatch): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (patch.title !== undefined) {
    const title = patch.title.trim().slice(0, MAX_TITLE_LENGTH);
    if (!title) throw new Error("A task title cannot be empty.");
    payload.title = title;
  }

  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.dueDate !== undefined) payload.dueDate = patch.dueDate;
  if (patch.description !== undefined) {
    payload.description = toDescription(patch.description);
  }
  if (patch.tags !== undefined) payload.tags = normalizeTags(patch.tags);
  if (patch.isArchived !== undefined) payload.isArchived = patch.isArchived;

  await updateDoc(doc(db, TASKS_COLLECTION, taskId), payload);
}

/** Renames a task from the inline title editor. */
export async function setTaskTitle(
  taskId: string,
  title: string,
): Promise<void> {
  await patchTask(taskId, { title });
}

/** Stores the persistent priority level (low | medium | high). */
export async function setTaskPriority(
  taskId: string,
  priority: Priority,
): Promise<void> {
  await patchTask(taskId, { priority });
}

/** Stores — or clears, with `null` — the ISO `YYYY-MM-DD` due date. */
export async function setTaskDueDate(
  taskId: string,
  dueDate: string | null,
): Promise<void> {
  await patchTask(taskId, { dueDate });
}

/** Saves the long-form drawer notes; an empty string clears them to `null`. */
export async function setTaskDescription(
  taskId: string,
  description: string | null,
): Promise<void> {
  await patchTask(taskId, { description });
}

/** Replaces the task's tag list with a freshly normalized one. */
export async function setTaskTags(
  taskId: string,
  tags: string[],
): Promise<void> {
  await patchTask(taskId, { tags });
}

/** Flips the soft-hide `isArchived` flag from the row action. */
export async function setTaskArchived(
  taskId: string,
  isArchived: boolean,
): Promise<void> {
  await patchTask(taskId, { isArchived });
}

/** Flips the persisted `isCompleted` boolean for one task. */
export async function setTaskCompletion(
  taskId: string,
  isCompleted: boolean,
): Promise<void> {
  await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
    isCompleted,
    updatedAt: serverTimestamp(),
  });
}

/** Permanently removes a task document. */
export async function removeTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
}

/**
 * Bulk delete, chunked under the batch ceiling. Used by "Clear completed"
 * after the ids have already been resolved from the live snapshot.
 */
export async function removeTasks(taskIds: readonly string[]): Promise<void> {
  for (let start = 0; start < taskIds.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);

    for (const taskId of taskIds.slice(start, start + BATCH_LIMIT)) {
      batch.delete(doc(db, TASKS_COLLECTION, taskId));
    }

    await batch.commit();
  }
}

/**
 * Bulk completion, used by the master checkbox above the list. One batched
 * write per chunk means the whole visible list flips in a single round-trip
 * instead of N sequential `updateDoc` calls.
 */
export async function setTasksCompletion(
  taskIds: readonly string[],
  isCompleted: boolean,
): Promise<void> {
  for (let start = 0; start < taskIds.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);

    for (const taskId of taskIds.slice(start, start + BATCH_LIMIT)) {
      batch.update(doc(db, TASKS_COLLECTION, taskId), {
        isCompleted,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  }
}

type TaskSubscriptionHandlers = {
  onData: (tasks: Task[]) => void;
  onError: (error: Error) => void;
};

/**
 * Real-time listener scoped to a single user:
 * `where("userId", "==", userId)` guarantees tenant isolation, and
 * `orderBy("createdAt", "desc")` sorts server-side so the newest task always
 * sits on top without a client round-trip.
 *
 * Returns the `onSnapshot` unsubscribe function so callers can tear the
 * listener down on logout/unmount (required to avoid leaks).
 */
export function subscribeToUserTasks(
  userId: string,
  { onData, onError }: TaskSubscriptionHandlers,
): Unsubscribe {
  const tasks = collection(db, TASKS_COLLECTION);
  const ordered = query(
    tasks,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const unordered = query(tasks, where("userId", "==", userId));

  let unsubscribe: Unsubscribe | null = null;

  unsubscribe = onSnapshot(
    ordered,
    (snapshot) => onData(snapshot.docs.map(toTask)),
    (error) => {
      // A missing composite index surfaces as `failed-precondition`. Fall back
      // to an un-ordered listener so the dashboard keeps working, and sort
      // newest-first on the client instead.
      if (error.code === "failed-precondition") {
        unsubscribe?.();
        unsubscribe = onSnapshot(
          unordered,
          (snapshot) => onData(sortNewestFirst(snapshot.docs.map(toTask))),
          onError,
        );
        return;
      }

      onError(error);
    },
  );

  return () => unsubscribe?.();
}
