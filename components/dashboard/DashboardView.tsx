"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UserRoundX, Info, SearchX, Tag } from "lucide-react";
import { useGuestGate } from "@/components/guest/GuestGateProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { TaskComposer } from "@/components/tasks/TaskComposer";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";
import {
  TaskFilterTabs,
  type TaskFilterTab,
} from "@/components/tasks/TaskFilterTabs";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskListSkeleton } from "@/components/tasks/TaskListSkeleton";
import { TaskSearchField } from "@/components/tasks/TaskSearchField";
import { TagFilter } from "@/components/tasks/TagFilter";
import { TaskStats } from "@/components/tasks/TaskStats";
import {
  GUEST_USER_ID,
  createGuestTask,
  patchGuestTask,
  readGuestTasks,
  removeGuestTask,
  toggleGuestTask,
  writeGuestTasks,
} from "@/lib/guestTasks";
import { collectTags } from "@/lib/tags";
import {
  removeTask,
  removeTasks,
  setTaskArchived,
  setTaskCompletion,
  setTaskDescription,
  setTaskDueDate,
  setTaskPriority,
  setTaskTags,
  setTaskTitle,
  setTasksCompletion,
  subscribeToUserTasks,
} from "@/lib/tasks";
import type { NewTaskInput, Priority, Task, TaskFilter } from "@/lib/types";
import { getDueDateState } from "@/lib/utils";

/** Prefix shared by the filter tabs and the panel they control. */
const FILTER_ID = "task-filter";

/**
 * Owns the task collection.
 *
 * Members get the real-time Firestore listener; a Guest Session gets a
 * localStorage-backed array instead and never opens a network write. Everything
 * downstream (search, tags, archive, bulk actions) is shared, with the Version 3
 * features routed through the GuestGateProvider paywall for guests.
 */
export function DashboardView() {
  const { user, isGuest } = useAuth();
  const { requestAccount } = useGuestGate();

  const [remoteTasks, setRemoteTasks] = useState<Task[]>([]);
  /* `readGuestTasks` is the lazy initialiser so localStorage is only touched on
     the client. Safe to hydrate because RequireAuth keeps this component
     unmounted until the session has resolved. */
  const [guestTasks, setGuestTasks] = useState<Task[]>(readGuestTasks);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [isClearingCompleted, setIsClearingCompleted] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.uid;

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserTasks(userId, {
      onData: (nextTasks) => {
        setRemoteTasks(nextTasks);
        setLoadedUserId(userId);
        setError(null);
      },
      onError: () => {
        setError(
          "We could not load your tasks. Check your connection and refresh the page.",
        );
        // Stop the skeleton even though no data arrived.
        setLoadedUserId(userId);
      },
    });

    return unsubscribe;
  }, [userId]);

  /* Guest writes are mirrored into localStorage. This is the only place a guest
     task is persisted, and it is a purely local call — never a Firestore
     request, so a guest can never trigger addDoc/setDoc. */
  useEffect(() => {
    if (!isGuest) return;
    writeGuestTasks(guestTasks);
  }, [isGuest, guestTasks]);

  /* ---- derived state -------------------------------------------------------
     Filtering stays entirely client-side (status tab → tag pill → keyword), so
     changing any of them never tears down and rebuilds the Firestore listener.
  ------------------------------------------------------------------------- */

  const tasks = isGuest ? guestTasks : remoteTasks;

  /* Only members can be waiting on a network round-trip; a guest's list is
     already in memory, so it never shows the skeleton. */
  const isLoading = !isGuest && Boolean(userId) && loadedUserId !== userId;

  const stats = useMemo(() => {
    /* Archived rows are soft-hidden: excluded from the headline counters and
       surfaced only by the Archived tab. */
    const scoped = tasks.filter((task) => !task.isArchived);
    const completed = scoped.filter((task) => task.isCompleted).length;
    const overdue = scoped.filter(
      (task) => !task.isCompleted && getDueDateState(task.dueDate)?.isOverdue,
    ).length;

    return {
      total: scoped.length,
      completed,
      overdue,
      active: scoped.length - completed,
      archived: tasks.length - scoped.length,
    };
  }, [tasks]);

  const statusFiltered = useMemo(() => {
    const scoped =
      filter === "archived"
        ? tasks.filter((task) => task.isArchived)
        : tasks.filter((task) => !task.isArchived);

    if (filter === "active") return scoped.filter((task) => !task.isCompleted);
    if (filter === "completed") {
      return scoped.filter((task) => task.isCompleted);
    }

    return scoped;
  }, [tasks, filter]);

  const tagFiltered = useMemo(() => {
    if (!activeTag) return statusFiltered;

    const needle = activeTag.toLowerCase();
    return statusFiltered.filter((task) =>
      task.tags.some((tag) => tag.toLowerCase() === needle),
    );
  }, [statusFiltered, activeTag]);

  /* Keyword search — a title substring match, applied last. */
  const visibleTasks = useMemo(() => {
    const needle = isGuest ? "" : query.trim().toLowerCase();
    if (!needle) return tagFiltered;

    return tagFiltered.filter((task) =>
      task.title.toLowerCase().includes(needle),
    );
  }, [tagFiltered, query, isGuest]);

  const completedVisibleCount = useMemo(
    () => visibleTasks.filter((task) => task.isCompleted).length,
    [visibleTasks],
  );

  const tabs = useMemo<readonly TaskFilterTab[]>(
    () => [
      { id: "all", label: "All", count: stats.total },
      { id: "active", label: "Active", count: stats.active },
      { id: "completed", label: "Completed", count: stats.completed },
      { id: "archived", label: "Archived", count: stats.archived },
    ],
    [stats],
  );

  const tagSuggestions = useMemo(() => collectTags(tasks), [tasks]);

  /* Resolved from the live snapshot, so the open drawer reflects edits and
     closes itself if the task is deleted underneath it. */
  const detailTask = useMemo(
    () =>
      detailTaskId
        ? (tasks.find((task) => task.id === detailTaskId) ?? null)
        : null,
    [tasks, detailTaskId],
  );

  /* Empty-state copy for when a search term or tag pill emptied the list. */
  const emptyOverride = useMemo(() => {
    if (isGuest) return undefined;

    if (query.trim()) {
      return {
        title: "No matches",
        body: `Nothing matches “${query.trim()}”. Try a different keyword.`,
        Icon: SearchX,
      };
    }

    if (activeTag) {
      return {
        title: "Nothing with that tag",
        body: `No tasks are tagged “${activeTag}” yet.`,
        Icon: Tag,
      };
    }

    return undefined;
  }, [isGuest, query, activeTag]);

  /* ---- guest-aware writers -------------------------------------------------
     Every mutation funnels through these callbacks: members write to Firestore,
     guests only ever touch the local array, so no guest code path can reach
     addDoc / updateDoc / batch writes.
  ------------------------------------------------------------------------- */

  const updateGuest = useCallback((updater: (current: Task[]) => Task[]) => {
    setGuestTasks(updater);
  }, []);

  const handleToggle = useCallback(
    (task: Task) => {
      if (isGuest) {
        updateGuest((current) => toggleGuestTask(current, task.id));
        return;
      }

      setTaskCompletion(task.id, !task.isCompleted).catch(() => {
        setError("Could not update that task. Please try again.");
      });
    },
    [isGuest, updateGuest],
  );

  const handleDelete = useCallback(
    (task: Task) => {
      if (isGuest) {
        updateGuest((current) => removeGuestTask(current, task.id));
        return;
      }

      removeTask(task.id).catch(() => {
        setError("Could not delete that task. Please try again.");
      });
    },
    [isGuest, updateGuest],
  );

  const handleRename = useCallback(
    (task: Task, title: string) => {
      if (isGuest) {
        updateGuest((current) => patchGuestTask(current, task.id, { title }));
        return;
      }

      setTaskTitle(task.id, title).catch(() => {
        setError("Could not rename that task. Please try again.");
      });
    },
    [isGuest, updateGuest],
  );

  const handlePriorityChange = useCallback(
    (task: Task, priority: Priority) => {
      if (isGuest) {
        updateGuest((current) => patchGuestTask(current, task.id, { priority }));
        return;
      }

      setTaskPriority(task.id, priority).catch(() => {
        setError("Could not update the priority. Please try again.");
      });
    },
    [isGuest, updateGuest],
  );

  const handleDueDateChange = useCallback(
    (task: Task, dueDate: string | null) => {
      if (isGuest) {
        updateGuest((current) => patchGuestTask(current, task.id, { dueDate }));
        return;
      }

      setTaskDueDate(task.id, dueDate).catch(() => {
        setError("Could not update the due date. Please try again.");
      });
    },
    [isGuest, updateGuest],
  );

  /* Guest capture: local array only. Tags are a member-only feature, so the
     composer hides that control for guests (see `isTagsLocked`). */
  const handleGuestCreate = useCallback(async (input: NewTaskInput) => {
    setGuestTasks((current) => [
      createGuestTask({
        title: input.title,
        priority: input.priority,
        dueDate: input.dueDate,
      }),
      ...current,
    ]);
  }, []);

  const handleCloseDetails = useCallback(() => setDetailTaskId(null), []);

  const handleDescriptionSave = useCallback(
    (task: Task, description: string | null) => {
      setTaskDescription(task.id, description).catch(() => {
        setError("Could not save those notes. Please try again.");
      });
    },
    [],
  );

  const handleTagsChange = useCallback((task: Task, tags: string[]) => {
    setTaskTags(task.id, tags).catch(() => {
      setError("Could not update the tags. Please try again.");
    });
  }, []);

  /* ---- Version 3 actions — paywall-intercepted for guests --------------- */

  const handleOpenDetails = useCallback(
    (task: Task) => {
      if (isGuest) {
        requestAccount("detail");
        return;
      }

      setDetailTaskId(task.id);
    },
    [isGuest, requestAccount],
  );

  const handleToggleArchive = useCallback(
    (task: Task) => {
      if (isGuest) {
        requestAccount("archive");
        return;
      }

      setTaskArchived(task.id, !task.isArchived).catch(() => {
        setError("Could not update the archive state. Please try again.");
      });
    },
    [isGuest, requestAccount],
  );

  /* Guests are blocked from the Archived view as well as the archive action. */
  const handleFilterChange = useCallback(
    (next: TaskFilter) => {
      if (next === "archived" && isGuest) {
        requestAccount("archive");
        return;
      }

      setFilter(next);
    },
    [isGuest, requestAccount],
  );

  /* Bulk toggle: one batched write for every currently visible row. */
  const handleToggleAll = useCallback(
    (isCompleted: boolean) => {
      if (isGuest) {
        requestAccount("bulk");
        return;
      }

      const ids = visibleTasks.map((task) => task.id);
      if (ids.length === 0) return;

      setTasksCompletion(ids, isCompleted).catch(() => {
        setError("Could not update those tasks. Please try again.");
      });
    },
    [isGuest, requestAccount, visibleTasks],
  );

  /* Clear completed: resolve the ids from the live snapshot, then batch delete. */
  const handleClearCompleted = useCallback(() => {
    if (isGuest) {
      requestAccount("bulk");
      return;
    }

    const ids = tasks
      .filter((task) => task.isCompleted)
      .map((task) => task.id);

    if (ids.length === 0) return;

    setIsClearingCompleted(true);
    removeTasks(ids)
      .catch(() => {
        setError("Could not clear the completed tasks. Please try again.");
      })
      .finally(() => setIsClearingCompleted(false));
  }, [isGuest, requestAccount, tasks]);

  const handleSearchLockedClick = useCallback(() => {
    requestAccount("search");
  }, [requestAccount]);

  const handleTagsLockedClick = useCallback(() => {
    requestAccount("tags");
  }, [requestAccount]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          My tasks
        </h1>
        <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
          {isGuest
            ? "You are browsing as a guest — tasks are kept in this browser only."
            : "Everything here lives in Firestore and syncs the moment it changes."}
        </p>
      </header>

      {isGuest ? (
        <div className="flex flex-wrap items-start gap-3 rounded-panel border border-accent-strong/30 bg-accent-soft p-4 dark:border-accent-primary/40 dark:bg-accent-primary/10">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-card-light text-accent-strong dark:bg-surface-card-dark dark:text-accent-primary"
          >
            <UserRoundX className="size-5" />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-header-light dark:text-text-header-dark">
              Guest Mode
            </p>
            <p className="mt-1 text-sm text-text-body-light dark:text-text-body-dark">
              Your tasks are saved in this browser only — nothing is sent to the
              server.
            </p>
            <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-text-muted-light dark:text-text-muted-dark">
              <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              Search, descriptions, tags, bulk actions and archiving unlock with
              a free account.
            </p>
          </div>
        </div>
      ) : null}

      <TaskStats
        total={stats.total}
        active={stats.active}
        completed={stats.completed}
        overdue={stats.overdue}
      />

      {user || isGuest ? (
        <TaskComposer
          userId={user?.uid ?? GUEST_USER_ID}
          tagSuggestions={tagSuggestions}
          onCreate={isGuest ? handleGuestCreate : undefined}
          isTagsLocked={isGuest}
          onTagsLockedClick={handleTagsLockedClick}
        />
      ) : null}

      <div className="space-y-3">
        <TaskSearchField
          value={query}
          onChange={setQuery}
          isLocked={isGuest}
          onLockedClick={handleSearchLockedClick}
        />

        {isGuest ? null : (
          <TagFilter
            tags={tagSuggestions}
            value={activeTag}
            onChange={setActiveTag}
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

      <TaskFilterTabs
        value={filter}
        onChange={handleFilterChange}
        tabs={tabs}
        idBase={FILTER_ID}
      />

      <section
        id={`${FILTER_ID}-panel`}
        role="tabpanel"
        aria-labelledby={`${FILTER_ID}-tab-${filter}`}
        className="focus-visible:outline-none"
      >
        {isLoading ? (
          <TaskListSkeleton rows={3} />
        ) : error && tasks.length === 0 ? null : (
          <TaskList
            tasks={visibleTasks}
            filter={filter}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onRename={handleRename}
            onPriorityChange={handlePriorityChange}
            onDueDateChange={handleDueDateChange}
            onOpenDetails={handleOpenDetails}
            onToggleArchive={handleToggleArchive}
            onToggleAll={handleToggleAll}
            completedVisibleCount={completedVisibleCount}
            onClearCompleted={handleClearCompleted}
            completedCount={stats.completed}
            isClearingCompleted={isClearingCompleted}
            emptyOverride={emptyOverride}
          />
        )}
      </section>

      {/* Guests never reach the drawer — their row click is intercepted. */}
      {isGuest ? null : (
        <TaskDetailDrawer
          task={detailTask}
          onClose={handleCloseDetails}
          onDescriptionSave={handleDescriptionSave}
          onTagsChange={handleTagsChange}
          tagSuggestions={tagSuggestions}
        />
      )}
    </div>
  );
}
