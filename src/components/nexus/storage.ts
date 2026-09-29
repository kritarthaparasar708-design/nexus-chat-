import { createSeedState } from "./data";
import type { DemoState } from "./types";

export const NEXUS_STORAGE_KEY = "nexus-chat-demo-state-v2";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function loadPersistedState(): DemoState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(NEXUS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    const seed = createSeedState();
    return {
      ...seed,
      ...parsed,
      currentUser: {
        ...seed.currentUser,
        ...(isRecord(parsed["currentUser"]) ? parsed["currentUser"] : {}),
      },
      settings: {
        ...seed.settings,
        ...(isRecord(parsed["settings"]) ? parsed["settings"] : {}),
      },
      session: {
        ...seed.session,
        ...(isRecord(parsed["session"]) ? parsed["session"] : {}),
      },
      conversations: Array.isArray(parsed["conversations"])
        ? (parsed["conversations"] as DemoState["conversations"])
        : seed.conversations,
      friends: Array.isArray(parsed["friends"])
        ? (parsed["friends"] as DemoState["friends"])
        : seed.friends,
      notifications: Array.isArray(parsed["notifications"])
        ? (parsed["notifications"] as DemoState["notifications"])
        : seed.notifications,
      stories: Array.isArray(parsed["stories"])
        ? (parsed["stories"] as DemoState["stories"])
        : seed.stories,
      recentSearches: Array.isArray(parsed["recentSearches"])
        ? parsed["recentSearches"].filter((item): item is string => typeof item === "string")
        : seed.recentSearches,
    };
  } catch {
    return null;
  }
}

export function savePersistedState(state: DemoState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(NEXUS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local persistence is best-effort in this demo application.
  }
}
