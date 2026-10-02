"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Check,
  Play,
  Plus,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const PREVIEW_TASKS = [
  { title: "Ship the Planit dashboard", completed: true, date: "Today" },
  { title: "Review Firestore security rules", completed: false, date: "Today" },
  { title: "Plan the weekly review ritual", completed: false, date: "Tomorrow" },
];

const TRUST_POINTS = ["Free forever", "No credit card", "WCAG 2.1 AA"];

export function LandingHero() {
  const shouldReduceMotion = useReducedMotion();
  const { startGuestSession } = useAuth();
  const router = useRouter();
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  /* Guest entry: flip the global client flag and route straight in. No Firebase
     call is made — V3 restrictions stay enforced by the dashboard gate. */
  const handleGuestPreview = () => {
    startGuestSession();
    router.push("/dashboard");
  };

  const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.45,
      delay: shouldReduceMotion ? 0 : delay,
      ease: "easeOut" as const,
    },
  });

  return (
    <section className="relative isolate overflow-hidden">
    {/* Hero backdrop built from the dashboard's own geometry — donut progress
    ring + dot grid + pastel chips. Flat fills, no gradients, no blur. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Dot grid — the dashboard's canvas texture, barely there */}
        <div
          className="absolute inset-0 opacity-[0.55] dark:opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            color: "var(--color-accent-primary)",
            maskImage:
              "radial-gradient(120% 90% at 70% 20%, #000 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(120% 90% at 70% 20%, #000 30%, transparent 75%)",
          }}
        />

        {/* Donut progress ring — the reference's hero graphic, bled off-canvas */}
        <svg
          viewBox="0 0 200 200"
          className="absolute -right-24 -top-28 size-[30rem] text-accent-soft dark:text-accent-primary/10"
        >
          <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" strokeWidth="26" />
          <circle
            cx="100" cy="100" r="78" fill="none"
            stroke="var(--color-accent-primary)" strokeWidth="26"
            strokeLinecap="round" strokeDasharray="490" strokeDashoffset="150"
            opacity="0.55"
            transform="rotate(-90 100 100)"
          />
        </svg>

        {/* Pastel chips — sampled chip palette, decorative only */}
        <span className="absolute left-[46%] top-24 size-3 rounded-full bg-chip-coral/70" />
        <span className="absolute left-[42%] top-56 size-2 rounded-full bg-chip-teal/80" />
        <span className="absolute left-[52%] top-80 h-6 w-16 rounded-full bg-chip-mint/70" />
        <span className="absolute right-[6%] top-[55%] size-4 rounded-full bg-chip-indigo/60" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div>
          <motion.p
            {...reveal(0)}
            className="inline-flex items-center gap-2 rounded-full border border-border-light bg-surface-card-light px-3 py-1.5 text-xs font-semibold text-text-muted-light shadow-sm dark:border-border-dark dark:bg-surface-card-dark dark:text-text-muted-dark"
          >
            <Zap
              aria-hidden="true"
              className="size-3.5 text-accent-strong dark:text-accent-primary"
            />
            Real-time sync · Firebase powered
          </motion.p>

          <motion.h1
            {...reveal(0.06)}
            className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Plan your day.
            <span className="block text-accent-strong dark:text-accent-primary">
              Actually finish it.
            </span>
          </motion.h1>

          <motion.p
            {...reveal(0.12)}
            className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg"
          >
            Planit keeps every task in one calm, real-time list. Capture in a
            keystroke, complete with one tap, and watch the change land on every
            device the moment it happens.
          </motion.p>

          <motion.div
            {...reveal(0.18)}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/login"
              className={buttonStyles("primary", "lg", "w-full sm:w-auto")}
            >
              Get started free
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/dashboard"
              className={buttonStyles("secondary", "lg", "w-full sm:w-auto")}
            >
              Open the dashboard
            </Link>
          </motion.div>

          <motion.ul
            {...reveal(0.24)}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted-light dark:text-text-muted-dark"
          >
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-success" />
                {point}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Product preview — the mock content is hidden from assistive tech, but the
            overlay below is a real control reachable by keyboard and touch. */}
        <motion.div
          {...reveal(0.2)}
          onMouseEnter={() => setIsPreviewActive(true)}
          onMouseLeave={() => setIsPreviewActive(false)}
          onFocusCapture={() => setIsPreviewActive(true)}
          onBlurCapture={(event) => {
            const next =
              event.relatedTarget instanceof Node ? event.relatedTarget : null;
            if (!next || !event.currentTarget.contains(next)) {
              setIsPreviewActive(false);
            }
          }}
          onTouchStart={(event) => {
            if (event.touches.length === 1) setIsPreviewActive(true);
          }}
          className="group relative"
        >
          <div
            aria-hidden="true"
            className={cn(
              "rounded-panel border border-border-light bg-surface-card-light p-3 shadow-card-hover transition-[filter] duration-300 sm:p-4 dark:border-border-dark dark:bg-surface-card-dark",
              isPreviewActive && "blur-[2px]",
            )}
          >
            <div className="flex items-center justify-between gap-3 rounded-card bg-app-bg-light px-3 py-2.5 dark:bg-app-bg-dark">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-strong text-xs font-bold text-accent-fg">
                  PM
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-semibold text-text-header-light dark:text-text-header-dark">
                    My day
                  </span>
                  <span className="block text-xs text-text-muted-light dark:text-text-muted-dark">
                    3 tasks · 1 done
                  </span>
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-accent-primary/30 px-2.5 py-1 text-xs font-semibold text-accent-strong dark:text-accent-primary">
                Synced
              </span>
            </div>

            <ul className="mt-3 space-y-2">
              {PREVIEW_TASKS.map((task) => (
                <li
                  key={task.title}
                  className="flex items-center gap-3 rounded-card border border-border-light px-3 py-3 dark:border-border-dark"
                >
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-md border",
                      task.completed
                        ? "border-accent-primary bg-accent-primary text-accent-fg"
                        : "border-border-light dark:border-border-dark",
                    )}
                  >
                    {task.completed ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : null}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium",
                        task.completed
                          ? "text-text-muted-light line-through dark:text-text-muted-dark"
                          : "text-text-header-light dark:text-text-header-dark",
                      )}
                    >
                      {task.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-text-muted-light dark:text-text-muted-dark">
                      <Calendar className="size-3" />
                      {task.date}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center gap-2 rounded-card border border-border-light bg-app-bg-light px-3 py-2.5 dark:border-border-dark dark:bg-app-bg-dark">
              <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
                Add a task…
              </span>
              <span className="ml-auto grid size-7 shrink-0 place-items-center rounded-md bg-accent-primary text-accent-fg">
                <Plus className="size-4" />
              </span>
            </div>
          </div>

          {/* Guest entry overlay — revealed on hover / focus / touch */}
          <motion.div
            aria-hidden={!isPreviewActive}
            inert={!isPreviewActive}
            initial={false}
            animate={{ opacity: isPreviewActive ? 1 : 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.25,
              ease: "easeOut",
            }}
            className={cn(
              "absolute inset-0 grid place-items-center rounded-panel bg-slate-950/55 backdrop-blur-[2px] dark:bg-slate-950/60",
              !isPreviewActive && "pointer-events-none",
            )}
          >
            <motion.button
              type="button"
              onClick={handleGuestPreview}
              tabIndex={isPreviewActive ? 0 : -1}
              aria-label="Interact Live in Guest Mode — no account needed, tasks stay in this browser"
              initial={false}
              animate={{
                scale: isPreviewActive ? 1 : 0.96,
                y: isPreviewActive ? 0 : 8,
              }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 300, damping: 24 }
              }
              className="inline-flex min-h-12 items-center gap-2.5 whitespace-nowrap rounded-full bg-accent-strong px-7 text-base font-semibold text-accent-fg shadow-card-hover transition-colors hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-fg focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <Play aria-hidden="true" className="size-5 fill-current" />
              Interact Live (Guest Mode)
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
