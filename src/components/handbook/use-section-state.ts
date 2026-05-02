"use client";

import { useEffect, useState } from "react";

export function useSectionState(uid: string) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  const storageKey = `handbook:expanded-sections:${uid}`;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) setExpanded(new Set(JSON.parse(stored)));
    } catch {
      // ignore — keep default closed
    }
    setHydrated(true);
  }, [storageKey]);

  function toggle(sectionId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }

  function isOpen(sectionId: string): boolean {
    if (!hydrated) return false;
    return expanded.has(sectionId);
  }

  return { isOpen, toggle, hydrated };
}
