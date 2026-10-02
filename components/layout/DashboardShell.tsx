"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ListTodo, LogOut, Menu, UserPlus, X } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { logOut } from "@/lib/auth";
import { cn, initialsOf } from "@/lib/utils";
import type { User } from "firebase/auth";

type NavigationBodyProps = {
  user: User | null;
  isSigningOut: boolean;
  onSignOut: () => void;
  /** Guests have no Firebase profile — the chip describes the local session. */
  isGuest: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
  closeButtonClassName?: string;
};

function NavigationBody({
  user,
  isSigningOut,
  onSignOut,
  isGuest,
  onNavigate,
  onClose,
  closeButtonRef,
  closeButtonClassName,
}: NavigationBodyProps) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Logo />

        {onClose ? (
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className={cn(
              "grid size-11 place-items-center rounded-lg text-text-muted-light transition-colors hover:bg-app-bg-light hover:text-text-header-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 dark:text-text-muted-dark dark:hover:bg-app-bg-dark dark:hover:text-text-header-dark dark:focus-visible:ring-accent-primary",
              closeButtonClassName,
            )}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3 rounded-card border border-border-light bg-app-bg-light p-3 dark:border-border-dark dark:bg-app-bg-dark">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-strong text-sm font-bold text-accent-fg"
        >
          {isGuest ? "G" : initialsOf(user ?? {})}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold text-text-header-light dark:text-text-header-dark">
            {isGuest ? "Guest session" : (user?.displayName ?? "Planit member")}
          </span>
          <span className="block truncate text-xs text-text-muted-light dark:text-text-muted-dark">
            {isGuest
              ? "Local to this browser"
              : (user?.email ?? "Signed in")}
          </span>
        </span>
      </div>

      <nav aria-label="Dashboard" className="flex-1 space-y-2">
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
          Workspace
        </p>

        <ul className="space-y-1">
          <li>
            <Link
              href="/dashboard"
              onClick={onNavigate}
              aria-current="page"
              className="flex items-center gap-3 rounded-full bg-accent-soft px-4 py-3 text-sm font-semibold text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card-light dark:bg-accent-primary/15 dark:text-accent-primary dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-surface-card-dark"
            >
              <ListTodo aria-hidden="true" className="size-4" />
              All tasks
            </Link>
          </li>
        </ul>
      </nav>

      <div className="space-y-2">
        {/* Manual light/dark switch — lives with the account actions. */}
        <ThemeToggle showLabel />

        {isGuest ? (
          <Link
            href="/login"
            className="flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent-strong px-5 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card-light dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-surface-card-dark"
          >
            <UserPlus aria-hidden="true" className="size-4" />
            Create a free account
          </Link>
        ) : null}

        <Button
          variant="secondary"
          onClick={onSignOut}
          isLoading={isSigningOut}
          className="w-full justify-start"
        >
          <LogOut aria-hidden="true" className="size-4" />
          {isGuest ? "Exit guest mode" : "Log out"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Dashboard chrome: a static navigation rail from `lg` upwards, and a
 * slide-out drawer (Escape to close, focus moved in and restored on exit) on
 * smaller viewports.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, isGuest, endGuestSession } = useAuth();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  /* Escape closes the drawer; focus is moved in on open and restored on exit. */
  useEffect(() => {
    if (!isNavOpen) return;

    const trigger = triggerRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsNavOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [isNavOpen]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    /* A guest has no Firebase session to end — clear the local flag instead. */
    if (isGuest) {
      endGuestSession();
      router.replace("/login");
      return;
    }

    try {
      await logOut();
      router.replace("/login");
    } catch {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1">
      {/* Desktop navigation rail */}
      <aside className="hidden w-72 shrink-0 border-r border-border-light bg-surface-card-light p-5 lg:sticky lg:top-0 lg:block lg:h-screen dark:border-border-dark dark:bg-surface-card-dark">
        <NavigationBody
          user={user}
          isSigningOut={isSigningOut}
          onSignOut={handleSignOut}
          isGuest={isGuest}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border-light bg-surface-card-light/90 px-4 py-3 backdrop-blur lg:hidden dark:border-border-dark dark:bg-surface-card-dark/90">
          <Logo markOnly />

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <button
              ref={triggerRef}
              type="button"
              onClick={() => setIsNavOpen(true)}
              aria-expanded={isNavOpen}
              aria-controls="dashboard-navigation"
              aria-label="Open navigation menu"
              className="grid size-11 place-items-center rounded-full border border-border-light bg-surface-card-light text-text-header-light transition-colors hover:bg-app-bg-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:border-border-dark dark:bg-surface-card-dark dark:text-text-header-dark dark:hover:bg-app-bg-dark dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark"
            >
              <Menu aria-hidden="true" className="size-5" />
            </button>
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
        >
          {children}
        </main>
      </div>

      <AnimatePresence>
        {isNavOpen ? (
          <motion.div
            key="dashboard-navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div
              aria-hidden="true"
              onClick={() => setIsNavOpen(false)}
              className="absolute inset-0 bg-slate-950/60"
            />

            <motion.div
              id="dashboard-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard navigation"
              initial={{ x: shouldReduceMotion ? 0 : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: shouldReduceMotion ? 0 : "-100%" }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.22,
                ease: "easeOut",
              }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border-light bg-surface-card-light p-5 shadow-card-hover dark:border-border-dark dark:bg-surface-card-dark"
            >
              <NavigationBody
                user={user}
                isSigningOut={isSigningOut}
                onSignOut={handleSignOut}
                isGuest={isGuest}
                onNavigate={() => setIsNavOpen(false)}
                onClose={() => setIsNavOpen(false)}
                closeButtonRef={closeButtonRef}
                closeButtonClassName="ring-offset-surface-card-light dark:ring-offset-surface-card-dark"
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
