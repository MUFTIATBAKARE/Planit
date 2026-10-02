"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth";
import { getAuthErrorMessage } from "@/lib/authErrors";
import type { AuthMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: ReadonlyArray<{ id: AuthMode; label: string }> = [
  { id: "signin", label: "Sign in" },
  { id: "signup", label: "Create account" },
];

export function AuthScreen() {
  const router = useRouter();
  const { user, loading, isGuest } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /* An existing — or guest — session never sees the form. */
  useEffect(() => {
    if (!loading && (user || isGuest)) router.replace("/dashboard");
  }, [loading, user, isGuest, router]);

  const selectTab = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  /* Roving-tabindex keyboard support for the tablist (WAI-ARIA tabs pattern). */
  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const lastIndex = TABS.length - 1;
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
    else if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = lastIndex;
    else return;

    event.preventDefault();
    selectTab(TABS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (password.length < 6) {
      setError("Your password needs at least 6 characters.");
      return;
    }
    if (mode === "signup" && !displayName.trim()) {
      setError("Add your name so the dashboard can greet you.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      router.replace("/dashboard");
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-6 sm:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">
          {mode === "signin"
            ? "Sign in to pick your list up where you left it."
            : "One account, every device, synced in real time."}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Authentication mode"
        className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-border-light bg-app-bg-light p-1 dark:border-border-dark dark:bg-app-bg-dark"
      >
        {TABS.map((tab, index) => {
          const isActive = mode === tab.id;

          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`auth-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="auth-panel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={cn(
                "relative min-h-11 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark",
                isActive
                  ? "text-accent-fg"
                  : "text-text-muted-light hover:text-text-header-light dark:text-text-muted-dark dark:hover:text-text-header-dark",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="auth-tab-indicator"
                  aria-hidden="true"
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.2,
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 rounded-full bg-accent-strong"
                />
              ) : null}
              <span className="relative">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form
        id="auth-panel"
        role="tabpanel"
        aria-labelledby={`auth-tab-${mode}`}
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 space-y-4"
      >
        <AnimatePresence initial={false}>
          {mode === "signup" ? (
            <motion.div
              key="display-name-field"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.2,
                ease: "easeOut",
              }}
              className="overflow-hidden"
            >
              <Input
                label="Full name"
                name="name"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Input
          label="Password"
          type={isPasswordVisible ? "text" : "password"}
          name="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="At least 6 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          trailing={
            <button
              type="button"
              onClick={() => setIsPasswordVisible((value) => !value)}
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              aria-pressed={isPasswordVisible}
              className="grid size-9 place-items-center rounded-md text-text-muted-light transition-colors hover:text-text-header-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong dark:text-text-muted-dark dark:hover:text-text-header-dark dark:focus-visible:ring-accent-primary"
            >
              {isPasswordVisible ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          }
        />

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
          >
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          isLoading={isSubmitting}
          className="w-full"
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
        {mode === "signin" ? "New to Planit? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => selectTab(mode === "signin" ? "signup" : "signin")}
          className="rounded font-semibold text-accent-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:text-accent-primary dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark"
        >
          {mode === "signin" ? "Create an account" : "Sign in instead"}
        </button>
      </p>
    </Card>
  );
}
