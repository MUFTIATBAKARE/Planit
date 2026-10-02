import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Surface container: rounded-card (16px, as in the reference) with adaptive tokens. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-border-light bg-surface-card-light shadow-card dark:border-border-dark dark:bg-surface-card-dark",
        className,
      )}
      {...rest}
    />
  );
}
