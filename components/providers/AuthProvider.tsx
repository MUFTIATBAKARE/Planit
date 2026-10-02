"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  /** True until Firebase has restored (or rejected) the persisted session. */
  loading: boolean;
  /**
   * True for an anonymous visitor using Guest Mode (V3). Guest tasks live in
   * localStorage only — see `lib/guestTasks.ts` for the storage helpers.
   */
  isGuest: boolean;
  /** Drops the app into an anonymous Guest Session. */
  startGuestSession: () => void;
  /** Leaves Guest Mode (used by "Sign up" flows and logout). */
  endGuestSession: () => void;
};

/** localStorage key marking an anonymous guest session. */
export const GUEST_SESSION_KEY = "planit-guest-session";

/** Internal event so a change in this tab notifies every subscriber. */
const GUEST_EVENT = "planit:guest-change";

/**
 * Guest Mode is deliberately a *client-only* flag rather than Google Anonymous
 * Auth: no Firebase user is ever created, so no Firestore request can ever be
 * attributed to (or attempted by) a guest.
 *
 * `useSyncExternalStore` reads localStorage as an external store so the value
 * survives a refresh, syncs across tabs, and never trips the
 * `set-state-in-effect` rule the way a useState + effect pair would.
 */
function readGuestFlag(): boolean {
  try {
    return window.localStorage.getItem(GUEST_SESSION_KEY) === "1";
  } catch {
    // Private mode / blocked storage: treat the visitor as signed out.
    return false;
  }
}

/** The server can never know about a client-only session. */
const getServerGuestFlag = (): boolean => false;

function subscribeToGuestFlag(onStoreChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === GUEST_SESSION_KEY) onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(GUEST_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(GUEST_EVENT, onStoreChange);
  };
}

function writeGuestFlag(next: boolean): void {
  try {
    if (next) window.localStorage.setItem(GUEST_SESSION_KEY, "1");
    else window.localStorage.removeItem(GUEST_SESSION_KEY);
  } catch {
    // Blocked storage: the flag still updates for this tab via the event below.
  }

  window.dispatchEvent(new Event(GUEST_EVENT));
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Tracks the Firebase session for the whole app. `onAuthStateChanged` survives
 * page reloads, so route protection resolves before any protected UI mounts.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isGuest = useSyncExternalStore(
    subscribeToGuestFlag,
    readGuestFlag,
    getServerGuestFlag,
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
        // A real session always supersedes an anonymous one.
        if (nextUser && readGuestFlag()) writeGuestFlag(false);
      },
      () => {
        // Even if the listener fails, never leave the UI stuck in a loading state.
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const startGuestSession = useCallback(() => {
    writeGuestFlag(true);
  }, []);

  const endGuestSession = useCallback(() => {
    writeGuestFlag(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, isGuest, startGuestSession, endGuestSession }),
    [user, loading, isGuest, startGuestSession, endGuestSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>.");
  }

  return context;
}
