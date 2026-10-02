"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Route guard for private screens.
 *
 * Unauthenticated visitors are redirected to /login, and children are never
 * mounted without a session — so no user-scoped Firestore query can start
 * before `user.uid` exists.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();

  /* A guest session counts as a valid session, so it is never redirected. */
  const hasSession = Boolean(user) || isGuest;

  useEffect(() => {
    if (!loading && !hasSession) router.replace("/login");
  }, [loading, hasSession, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-3 p-10 text-sm text-text-muted-light dark:text-text-muted-dark">
        <Spinner />
        Loading your workspace…
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm font-medium text-text-header-light dark:text-text-header-dark">
          Redirecting you to sign in…
        </p>
        <Link
          href="/login"
          className="rounded-lg text-sm font-semibold text-accent-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:text-accent-primary dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
