"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { GuestPaywallModal } from "@/components/guest/GuestPaywallModal";

/** Every Version 3 control a Guest Session is not allowed to reach. */
export type GuestFeature = "search" | "detail" | "tags" | "bulk" | "archive";

/** Contextual hint line shown inside the paywall. */
const FEATURE_NOTES: Record<GuestFeature, string> = {
  search: "Keyword search is available on a free account.",
  detail: "Task descriptions are available on a free account.",
  tags: "Tags and tag filters are available on a free account.",
  bulk: "Bulk actions are available on a free account.",
  archive: "Archiving is available on a free account.",
};

type GuestGateContextValue = {
  /** True while the paywall intercept is on screen. */
  isPromptOpen: boolean;
  /** Opens the paywall for a gated feature. */
  requestAccount: (feature: GuestFeature) => void;
  /** Dismisses the paywall. */
  closePrompt: () => void;
};

const GuestGateContext = createContext<GuestGateContextValue | undefined>(
  undefined,
);

/**
 * Central paywall intercept for Guest Mode (V3).
 *
 * Rather than scattering `isGuest` checks and modal state across every
 * component, gated controls simply call `requestAccount("search")` instead of
 * performing their action. Authenticated users never call it, so they never see
 * the prompt.
 *
 * A ref-like accessor is used for the feature note: because the modal is
 * dismissed before the next request, the last requested feature is kept in
 * state and the modal only mounts while `isPromptOpen` is true.
 */
export function GuestGateProvider({ children }: { children: ReactNode }) {
  const [feature, setFeature] = useState<GuestFeature | null>(null);

  const requestAccount = useCallback((next: GuestFeature) => {
    setFeature(next);
  }, []);

  const closePrompt = useCallback(() => {
    setFeature(null);
  }, []);

  const value = useMemo<GuestGateContextValue>(
    () => ({
      isPromptOpen: feature !== null,
      requestAccount,
      closePrompt,
    }),
    [feature, requestAccount, closePrompt],
  );

  return (
    <GuestGateContext.Provider value={value}>
      {children}

      <GuestPaywallModal
        isOpen={feature !== null}
        featureNote={feature ? FEATURE_NOTES[feature] : ""}
        onClose={closePrompt}
      />
    </GuestGateContext.Provider>
  );
}

export function useGuestGate(): GuestGateContextValue {
  const context = useContext(GuestGateContext);

  if (!context) {
    throw new Error("useGuestGate must be used inside a <GuestGateProvider>.");
  }

  return context;
}