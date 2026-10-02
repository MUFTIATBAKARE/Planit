"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LockKeyhole, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type GuestPaywallModalProps = {
  isOpen: boolean;
  /** Names the gated control that was clicked, for the contextual hint line. */
  featureNote: string;
  onClose: () => void;
};

/**
 * Guest paywall intercept.
 *
 * Opens whenever a Guest Session reaches for a Version 3 feature (search, task
 * descriptions, tags, bulk actions, archive). Scales up from `scale: 0.95` on a
 * spring and fades out completely on close.
 *
 * Accessibility: a real `role="dialog"` with `aria-modal`, focus moved to the
 * close button on open and restored to the triggering control on close,
 * Escape-to-close, a Tab cycle trapped inside the panel, and a body scroll lock.
 */
export function GuestPaywallModal({
  isOpen,
  featureNote,
  onClose,
}: GuestPaywallModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      /* Keep Tab inside the dialog while it is open. */
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="guest-paywall"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.2,
            ease: "easeOut",
          }}
          className="fixed inset-0 z-[60] grid place-items-center p-4"
        >
          <div
            aria-hidden="true"
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-paywall-title"
            aria-describedby="guest-paywall-body"
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 320, damping: 26 }
            }
            className="relative w-full max-w-md rounded-panel border border-border-light bg-surface-card-light p-6 shadow-card-hover dark:border-border-dark dark:bg-surface-card-dark"
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-text-muted-light transition-colors hover:bg-app-bg-light hover:text-text-header-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card-light dark:text-text-muted-dark dark:hover:bg-app-bg-dark dark:hover:text-text-header-dark dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-surface-card-dark"
            >
              <X aria-hidden="true" className="size-5" />
            </button>

            <span
              aria-hidden="true"
              className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-strong dark:bg-accent-primary/15 dark:text-accent-primary"
            >
              <Rocket className="size-6" />
            </span>

            <h2
              id="guest-paywall-title"
              className="mt-4 text-lg font-semibold text-text-header-light dark:text-text-header-dark"
            >
              Unlock the full workspace
            </h2>

            <p
              id="guest-paywall-body"
              className="mt-2 text-sm text-text-body-light dark:text-text-body-dark"
            >
              Sign up for a free account to unlock advanced productivity filters
              and descriptions.
            </p>

            <p className="mt-3 inline-flex items-start gap-2 rounded-card border border-border-light bg-app-bg-light px-3 py-2 text-xs text-text-muted-light dark:border-border-dark dark:bg-app-bg-dark dark:text-text-muted-dark">
              <LockKeyhole
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0"
              />
              {featureNote}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:grid sm:grid-cols-2">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-accent-strong px-4 text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card-light dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-surface-card-dark"
              >
                Create free account
              </Link>

              <Button variant="secondary" onClick={onClose} className="w-full">
                Keep browsing as guest
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}