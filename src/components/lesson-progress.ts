"use client";

import { useSyncExternalStore } from "react";

export function lessonStorageKey(courseSlug: string) {
  return `si-tutor:course:${courseSlug}`;
}

export function getCompletedLessons(savedProgress: string, lessonIds: readonly string[]) {
  const validIds = new Set(lessonIds);
  return new Set(savedProgress.split(",").filter((id) => validIds.has(id)));
}

const storageChange = "si-tutor-lesson-storage";
const inMemory = new Map<string, string>();

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(storageChange, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(storageChange, onChange);
  };
}

export function useSavedValue(key: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(key) ?? inMemory.get(key) ?? "";
      } catch {
        return inMemory.get(key) ?? "";
      }
    },
    () => "",
  );

  function save(next: string) {
    inMemory.set(key, next);
    try {
      window.localStorage.setItem(key, next);
    } catch {
      // Keep the value available in this tab when storage is unavailable.
    }
    window.dispatchEvent(new Event(storageChange));
  }

  return [value, save] as const;
}
