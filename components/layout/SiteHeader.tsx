"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { buttonStyles } from "@/components/ui/Button";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
] as const;

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border-light/80 bg-surface-card-light/85 backdrop-blur dark:border-border-dark/80 dark:bg-surface-card-dark/85">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-text-body-light transition-colors hover:bg-border-light/70 hover:text-text-header-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:text-text-body-dark dark:hover:bg-border-dark/70 dark:hover:text-text-header-dark dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link href="/login" className={buttonStyles("secondary", "sm")}>
            Sign in
          </Link>
          <Link href="/login" className={buttonStyles("primary", "sm")}>
            Get started free
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          className="grid size-11 place-items-center rounded-lg border border-border-light bg-surface-card-light text-text-header-light transition-colors hover:bg-app-bg-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light md:hidden dark:border-border-dark dark:bg-surface-card-dark dark:text-text-header-dark dark:hover:bg-app-bg-dark dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark"
        >
          {isOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="mobile-navigation"
            id="mobile-navigation"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.2,
              ease: "easeOut",
            }}
            className="overflow-hidden border-t border-border-light bg-surface-card-light md:hidden dark:border-border-dark dark:bg-surface-card-dark"
          >
            <nav
              aria-label="Mobile"
              className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6"
            >
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block rounded-lg px-3 py-3 text-sm font-medium text-text-body-light transition-colors hover:bg-app-bg-light hover:text-text-header-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong dark:text-text-body-dark dark:hover:bg-app-bg-dark dark:hover:text-text-header-dark dark:focus-visible:ring-accent-primary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-4 grid gap-2">
                <ThemeToggle showLabel />
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className={buttonStyles("secondary", "md")}
                >
                  Sign in
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className={buttonStyles("primary", "md")}
                >
                  Get started free
                </Link>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
