import {
  AlarmClock,
  CircleCheck,
  CircleDashed,
  ListTodo,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TaskStatsProps = {
  total: number;
  /** Tasks still to do (total − completed): the headline counter. */
  active: number;
  completed: number;
  overdue: number;
};

type StatChip = {
  key: string;
  label: string;
  value: number;
  Icon: LucideIcon;
  /** Pastel surface sampled from the reference artwork's stat row. */
  surface: string;
};

/**
 * Live status counter row.
 *
 * The region is a polite live region with `aria-atomic="false"`, so when a task
 * is completed or deleted a screen reader announces only the chip whose number
 * actually changed — never the whole row, and never interrupting the user.
 *
 * Note on the pastel surfaces: they stay light in *both* themes on purpose
 * (exactly as in the reference) and always carry near-black text, so the
 * contrast is >9:1 either way.
 */
export function TaskStats({ total, active, completed, overdue }: TaskStatsProps) {
  const percentComplete = total === 0 ? 0 : Math.round((completed / total) * 100);

  const chips: StatChip[] = [
    {
      key: "total",
      label: "Total tasks",
      value: total,
      Icon: ListTodo,
      surface: "bg-chip-indigo",
    },
    {
      key: "active",
      label: "Active",
      value: active,
      Icon: CircleDashed,
      surface: "bg-chip-teal",
    },
    {
      key: "completed",
      label: "Completed",
      value: completed,
      Icon: CircleCheck,
      surface: "bg-chip-mint",
    },
    {
      key: "overdue",
      label: "Overdue",
      value: overdue,
      Icon: AlarmClock,
      surface: "bg-chip-coral",
    },
  ];

  return (
    <div className="w-full space-y-3">
      <div
        aria-live="polite"
        aria-atomic="false"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {chips.map(({ key, label, value, Icon, surface }) => (
          <div
            key={key}
            className={cn(
              "flex items-center gap-3 rounded-card px-3 py-3",
              surface,
            )}
          >
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-white/45 text-text-header-light"
            >
              <Icon className="size-4" />
            </span>

            <span className="min-w-0">
              <span className="block text-xl font-semibold tabular-nums text-text-header-light">
                {value}
              </span>
              <span className="block truncate text-xs font-medium text-text-header-light/80">
                {label}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-light dark:bg-border-dark"
        >
          <div
            className="h-full rounded-full bg-accent-strong transition-[width] duration-300 motion-reduce:transition-none dark:bg-accent-primary"
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        <p className="shrink-0 text-xs font-medium text-text-muted-light dark:text-text-muted-dark">
          {completed} of {total} done
        </p>
      </div>
    </div>
  );
}
