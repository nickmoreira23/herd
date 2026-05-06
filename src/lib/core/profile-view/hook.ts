"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_PROFILE_VIEW, PROFILE_VIEWS, type ProfileView } from "./types";

const STORAGE_KEY = "herd:profile-view";
const EVENT_NAME = "herd:profile-view:change";

function readStored(): ProfileView | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw && (PROFILE_VIEWS as string[]).includes(raw) ? (raw as ProfileView) : null;
}

export function useProfileView() {
  // Lazy-init from localStorage on the client so every consumer of the hook
  // starts with the user's actual selection — no flash to the default view
  // when a sub-panel/sidebar/page-client mounts mid-session navigation.
  const [view, setView] = useState<ProfileView>(() => {
    if (typeof window === "undefined") return DEFAULT_PROFILE_VIEW;
    return readStored() ?? DEFAULT_PROFILE_VIEW;
  });

  useEffect(() => {
    // Re-sync after mount in case storage changed between SSR and hydration
    // (e.g., another tab updated the value).
    const stored = readStored();
    if (stored && stored !== view) setView(stored);

    const onChange = (e: Event) => {
      const next = (e as CustomEvent<ProfileView>).detail;
      if (next && (PROFILE_VIEWS as string[]).includes(next)) setView(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && (PROFILE_VIEWS as string[]).includes(e.newValue)) {
        setView(e.newValue as ProfileView);
      }
    };
    window.addEventListener(EVENT_NAME, onChange as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateView = useCallback((next: ProfileView) => {
    setView(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent<ProfileView>(EVENT_NAME, { detail: next }));
    }
  }, []);

  return { view, setView: updateView };
}
