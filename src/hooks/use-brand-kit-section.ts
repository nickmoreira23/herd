"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface UseBrandKitSectionReturn {
  settings: Record<string, string>;
  set: (key: string, value: string) => void;
  save: () => Promise<void>;
  saving: boolean;
  loading: boolean;
  isEmpty: boolean;
}

/**
 * Shared hook for brand kit section pages. Fetches settings from the API,
 * filters to only the relevant keys for that section, and provides save functionality.
 */
export function useBrandKitSection(
  relevantKeys: string[]
): UseBrandKitSectionReturn {
  const [allSettings, setAllSettings] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        const data = (json.data ?? {}) as Record<string, string>;
        setAllSettings(data);
        const filtered: Record<string, string> = {};
        for (const key of relevantKeys) {
          if (data[key] !== undefined && data[key] !== "") {
            filtered[key] = data[key];
          }
        }
        setSettings(filtered);
      })
      .catch(() => {
        toast.error("Failed to load settings");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      for (const key of relevantKeys) {
        if (settings[key] !== undefined) {
          payload[key] = settings[key];
        }
      }
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      toast.success("Saved successfully");
      window.dispatchEvent(new CustomEvent("brand-kit-updated"));
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const isEmpty = relevantKeys.every(
    (key) => !settings[key] || settings[key] === ""
  );

  return { settings: { ...allSettings, ...settings }, set, save, saving, loading, isEmpty };
}
