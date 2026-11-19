"use client";

import { useSyncExternalStore } from "react";
import { assertStore, cloneSeed, STORAGE_KEY, type Store } from "./demo-data";
import { migrateLegacy } from "./demo-migration";

const initial = { data: cloneSeed(), ready: false, storageError: "" };
let snapshot = initial;
const listeners = new Set<() => void>();
let initialized = false;
function emit() {
  listeners.forEach((listener) => listener());
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      assertStore(parsed);
      snapshot = { data: parsed, ready: true, storageError: "" };
    } else {
      const legacy = localStorage.getItem("mysol-central-demo-v2");
      if (legacy) {
        const data = migrateLegacy(JSON.parse(legacy));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        snapshot = { data, ready: true, storageError: "" };
      } else snapshot = { ...initial, ready: true, storageError: "" };
    }
  } catch {
    snapshot = {
      ...initial,
      ready: true,
      storageError:
        "Saved demo data could not be read. Sample records are shown. The unreadable dataset is retained until you save or reset. You can restore a valid backup in Settings.",
    };
  }
  emit();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!initialized) {
    initialized = true;
    queueMicrotask(load);
  }
  const sync = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) load();
  };
  window.addEventListener("storage", sync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", sync);
  };
}
export function useDemoStore() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => initial,
  );
}
export function commitDemo(data: Store) {
  assertStore(data);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    throw new Error(
      "Browser storage is unavailable or full. Changes were not saved. Enable browser storage and try again.",
    );
  }
  snapshot = { data, ready: true, storageError: "" };
  emit();
}
