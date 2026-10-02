import type { Priority } from "./types";

export type PriorityMeta = {
  value: Priority;
  /** Written label — priority is never communicated by colour alone. */
  label: string;
  /** Badge/chip treatment: tinted background + AA-safe text in both themes. */
  chipClassName: string;
  /** The small colour flag shown next to the label. */
  dotClassName: string;
};

/** Ascending order, used to render the dropdown and its ‹Low → High› scale. */
export const PRIORITY_ORDER: readonly Priority[] = ["low", "medium", "high"];

/** Applied whenever the user never picks a level. */
export const DEFAULT_PRIORITY: Priority = "medium";

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  low: {
    value: "low",
    label: "Low",
    chipClassName:
      "border-priority-low/30 bg-priority-low-soft text-priority-low dark:border-priority-low/40 dark:bg-priority-low/15 dark:text-priority-low-dark",
    dotClassName: "bg-priority-low dark:bg-priority-low-dark",
  },
  medium: {
    value: "medium",
    label: "Medium",
    chipClassName:
      "border-priority-medium/30 bg-priority-medium-soft text-priority-medium dark:border-priority-medium/40 dark:bg-priority-medium/15 dark:text-priority-medium-dark",
    dotClassName: "bg-priority-medium dark:bg-priority-medium-dark",
  },
  high: {
    value: "high",
    label: "High",
    chipClassName:
      "border-priority-high/30 bg-priority-high-soft text-priority-high dark:border-priority-high/40 dark:bg-priority-high/15 dark:text-priority-high-dark",
    dotClassName: "bg-priority-high dark:bg-priority-high-dark",
  },
};

/** Narrows an unknown Firestore value to a `Priority` (defends legacy docs). */
export function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "medium" || value === "high";
}

/** Metadata lookup that never throws for unexpected stored values. */
export function priorityMeta(value: Priority): PriorityMeta {
  return PRIORITY_META[value] ?? PRIORITY_META[DEFAULT_PRIORITY];
}
