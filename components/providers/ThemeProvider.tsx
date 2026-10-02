"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

/**
 * Same key the no-flash script in app/layout.tsx reads before first paint, so
 * a manual toggle and the pre-hydration paint can never disagree.
 */
export const THEME_STORAGE_KEY = "planit-theme";

type ThemeContextValue = {
  theme: Theme;
  /** False until the stored preference has been read on the client. */
  mounted: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Internal event so a toggle in this tab notifies every subscriber. */
const THEME_EVENT = "planit:theme-change";

/** The single source of truth is the `dark` class on <html>. */
function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

const getServerTheme = (): Theme => "light";

/** Hydration flag: false on the server, true once the client has mounted. */
const getMounted = (): boolean => true;
const getServerMounted = (): boolean => false;

function subscribe(onStoreChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === THEME_STORAGE_KEY &&
      (event.newValue === "dark" || event.newValue === "light")
    ) {
      // Mirror another tab's choice onto this document before notifying.
      document.documentElement.classList.toggle("dark", event.newValue === "dark");
    }

    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

/** Nothing to subscribe to for the hydration flag. */
function subscribeNoop(): () => void {
  return () => {};
}

function writeTheme(next: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Private mode / blocked storage: the class below still applies.
  }

  document.documentElement.classList.toggle("dark", next === "dark");
  window.dispatchEvent(new Event(THEME_EVENT));
}

/**
 * Manual light/dark theme layer (standard React context — no extra dependency).
 *
 * It owns two things only:
 *   1. the `dark` class on <html>, and
 *   2. the persisted preference in localStorage.
 *
 * Every colour in the app already resolves from the Tailwind `dark:` variant,
 * so no component needs to know the theme to stay consistent.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  /*
   * `useSyncExternalStore` reads the DOM class as an external store: the server
   * snapshot is always "light" (matching the pre-hydration markup), and React
   * re-syncs with the real value straight after hydration. That gives a manual
   * toggle with no setState inside an effect and no hydration mismatch.
   */
  const theme = useSyncExternalStore(subscribe, readTheme, getServerTheme);

  const mounted = useSyncExternalStore(
    subscribeNoop,
    getMounted,
    getServerMounted,
  );

  const setTheme = useCallback((next: Theme) => {
    writeTheme(next);
  }, []);

  /* Reads the live value rather than a captured one, so rapid clicks and
     cross-tab changes can never desynchronise the button. */
  const toggleTheme = useCallback(() => {
    writeTheme(readTheme() === "dark" ? "light" : "dark");
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mounted, setTheme, toggleTheme }),
    [theme, mounted, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside a <ThemeProvider>.");
  }

  return context;
}
