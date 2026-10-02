import Link from "next/link";
import { ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  className?: string;
  /** Renders only the mark (used by the collapsed mobile header). */
  markOnly?: boolean;
};

export function Logo({ href = "/", className, markOnly = false }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-strong text-accent-fg shadow-sm"
      >
        <ListTodo className="size-5" />
      </span>

      {markOnly ? (
        <span className="sr-only">Planit home</span>
      ) : (
        <span className="text-base font-semibold tracking-tight text-text-header-light dark:text-text-header-dark">
          Planit
        </span>
      )}
    </Link>
  );
}
