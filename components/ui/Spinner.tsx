import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible inline loading indicator (hidden from screen readers). */
export function Spinner({ className }: { className?: string }) {
  return (
    <LoaderCircle
      aria-hidden="true"
      focusable="false"
      className={cn(
        "size-4 shrink-0 animate-spin motion-reduce:animate-none",
        className,
      )}
    />
  );
}
