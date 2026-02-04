"use client";

import { useCallback, useSyncExternalStore } from "react";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";

export type CurrentUser = { name: string; role: string };

let cachedRaw: string | null = "";
let cachedSnapshot: CurrentUser | null = null;

function getSnapshot(): CurrentUser | null {
  if (globalThis.window === undefined) return null;
  const raw = globalThis.localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  if (!raw) {
    cachedSnapshot = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as CurrentUser;
    cachedSnapshot = parsed?.name ? parsed : null;
  } catch {
    cachedSnapshot = null;
  }
  return cachedSnapshot;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function useCurrentUser() {
  const user = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const setUser = useCallback((newUser: CurrentUser | null) => {
    if (newUser) {
      globalThis.localStorage.setItem(
        LOCAL_STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(newUser)
      );
    } else {
      globalThis.localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
    }
    notifyListeners();
  }, []);

  return { user, setUser, mounted: true };
}
