import type { Metadata } from "next";
import Link from "next/link";
import {
  Accessibility,
  Calendar,
  CircleCheck,
  Radio,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { LandingHero } from "@/components/landing/LandingHero";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { buttonStyles } from "@/components/ui/Button";

const landingTitle = "Planit — Real-Time Task Management for Focused Teams";
const landingDescription =
  "Capture tasks in a keystroke, complete them with one tap, and sync every change instantly with Firebase. Planit is a fast, accessible, real-time to-do app for individuals and teams.";

export const metadata: Metadata = {
  title: { absolute: landingTitle },
  description: landingDescription,
  keywords: [
    "real-time to-do app",
    "task management",
    "productivity",
    "firebase firestore tasks",
    "team task list",
    "planit",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Planit",
    title: landingTitle,
    description: landingDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: landingTitle,
    description: landingDescription,
  },
};

const FEATURES = [
  {
    icon: Radio,
    title: "Real-time by default",
    description:
      "Every change streams out of Firestore through onSnapshot, so the list you are looking at is never stale.",
    surface: "bg-chip-indigo",
  },
  {
    icon: ShieldCheck,
    title: "Private to your account",
    description:
      "Tasks are always queried with userId equality scoping, so one account can never read another account's data.",
    surface: "bg-chip-teal",
  },
  {
    icon: Zap,
    title: "Kinetic capture",
    description:
      "One input bar, one keystroke. New tasks are persisted instantly with addDoc() and appear immediately.",
    surface: "bg-chip-coral",
  },
  {
    icon: CircleCheck,
    title: "One-tap completion",
    description:
      "Tick the checkbox and the isCompleted boolean is written straight to the database.",
    surface: "bg-chip-mint",
  },
  {
    icon: Calendar,
    title: "Priorities & due dates",
    description:
      "Give every task a Low/Medium/High level and a deadline — stored as plain strings in Firestore.",
    surface: "bg-chip-indigo",
  },
  {
    icon: Accessibility,
    title: "Accessible by default",
    description:
      "Semantic markup, visible focus rings, 44px touch targets and polite live regions throughout.",
    surface: "bg-chip-teal",
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Create your account",
    description:
      "Sign up in seconds with an email and password — Firebase Auth keeps the session secure across reloads.",
  },
  {
    step: "02",
    title: "Capture what matters",
    description:
      "Type a task into the bar and press Enter. It is written to Firestore with a server-generated timestamp.",
  },
  {
    step: "03",
    title: "Finish and tidy up",
    description:
      "Tick items off with an animated strike-through, then delete whatever no longer deserves your attention.",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <LandingHero />

        <section
          id="features"
          aria-labelledby="features-heading"
          className="border-t border-border-light bg-surface-card-light dark:border-border-dark dark:bg-surface-card-dark"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong dark:text-accent-primary">
                Features
              </p>
              <h2
                id="features-heading"
                className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Everything you need, nothing more
              </h2>
              <p className="mt-4 text-base leading-relaxed">
                Planit stays deliberately narrow: a fast capture bar, a live
                list, and a database that never lets you down.
              </p>
            </div>

            <ul
              role="list"
              className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
            >
              {FEATURES.map(({ icon: Icon, title, description, surface }) => (
                <li
                  key={title}
                  className="rounded-card border border-border-light bg-surface-card-light p-6 shadow-card transition-shadow hover:shadow-card-hover dark:border-border-dark dark:bg-surface-card-dark"
                >
                  <span
                    aria-hidden="true"
                    className={`grid size-11 place-items-center rounded-full text-text-header-light shadow-sm ${surface}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed">{description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className="border-t border-border-light dark:border-border-dark"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <h2
              id="how-it-works-heading"
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              From empty list to done in three steps
            </h2>

            <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map(({ step, title, description }) => (
                <li
                  key={step}
                  className="rounded-card border border-border-light bg-surface-card-light p-6 shadow-card dark:border-border-dark dark:bg-surface-card-dark"
                >
                  <span className="inline-flex items-center rounded-full bg-accent-primary/30 px-3 py-1 text-xs font-bold text-accent-strong dark:text-accent-primary">
                    {step}
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="cta-heading"
          className="border-t border-border-light bg-surface-card-light dark:border-border-dark dark:bg-surface-card-dark"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="rounded-panel border border-border-light bg-app-bg-light px-6 py-12 text-center sm:px-12 dark:border-border-dark dark:bg-app-bg-dark">
              <h2
                id="cta-heading"
                className="text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Start your list in under a minute
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed">
                Create a free account and your dashboard is ready instantly — no
                setup, no credit card, no clutter.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className={buttonStyles("primary", "lg", "w-full sm:w-auto")}
                >
                  Create free account
                </Link>
                <Link
                  href="/dashboard"
                  className={buttonStyles("secondary", "lg", "w-full sm:w-auto")}
                >
                  Go to dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

