"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AppRow } from "./types";

const SYNC_FREQUENCY_OPTIONS = [
  { value: "15", label: "Every 15 minutes" },
  { value: "30", label: "Every 30 minutes" },
  { value: "60", label: "Every hour" },
  { value: "360", label: "Every 6 hours" },
  { value: "720", label: "Every 12 hours" },
  { value: "1440", label: "Daily" },
  { value: "10080", label: "Weekly" },
] as const;

const DATA_CATEGORY_LABELS: Record<string, string> = {
  SLEEP: "Sleep",
  ACTIVITY: "Activity",
  RECOVERY: "Recovery",
  HEART_RATE: "Heart Rate",
  WORKOUT: "Workout",
  READINESS: "Readiness",
  BODY: "Body",
  APP_NUTRITION: "Nutrition",
  APP_OTHER: "Other",
};

// All possible data categories
const ALL_DATA_CATEGORIES = [
  "SLEEP", "ACTIVITY", "RECOVERY", "HEART_RATE", "WORKOUT", "READINESS", "BODY", "APP_NUTRITION", "APP_OTHER",
] as const;

interface AppSettingsDialogProps {
  app: AppRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function AppSettingsDialog({
  app,
  open,
  onOpenChange,
  onSave,
}: AppSettingsDialogProps) {
  const [syncFrequency, setSyncFrequency] = useState("1440");
  const [enabledCategories, setEnabledCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (app) {
      setSyncFrequency(String(app.syncFrequencyMin));
      setEnabledCategories([...app.dataCategories]);
    }
  }, [app]);

  function toggleCategory(cat: string) {
    setEnabledCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  }

  async function handleSave() {
    if (!app) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncFrequencyMin: parseInt(syncFrequency, 10),
          dataCategories: enabledCategories,
        }),
      });
      if (res.ok) {
        toast.success("Settings saved");
        onOpenChange(false);
        onSave();
      } else {
        toast.error("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!app) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{app.name} Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Sync Frequency */}
          <div className="space-y-1.5">
            <Label className="text-xs">Sync Frequency</Label>
            <Select value={syncFrequency} onValueChange={(val) => setSyncFrequency(val ?? "1440")}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYNC_FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              How often to automatically sync data from {app.name}.
            </p>
          </div>

          {/* Data Categories */}
          <div className="space-y-2">
            <Label className="text-xs">Data Categories</Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Select which types of data to sync from this app.
            </p>
            <div className="space-y-2">
              {ALL_DATA_CATEGORIES.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm">
                    {DATA_CATEGORY_LABELS[cat] || cat}
                  </span>
                  <Switch
                    checked={enabledCategories.includes(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
