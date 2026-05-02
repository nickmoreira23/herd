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
import { useT } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import {
  ALL_DATA_CATEGORY_CODES,
  SYNC_FREQUENCY_VALUES,
  dataCategoryLabelKey,
  syncFrequencyLabelKey,
} from "@/lib/apps/provider-catalog";
import type { AppRow } from "./types";

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
  const t = useT();
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
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
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
        notifySuccess("apps.feedback.settings_saved", t);
        onOpenChange(false);
        onSave();
      } else {
        notifyError("error.apps.save_settings_failed", t);
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
          <DialogTitle>
            {t("apps.settings_dialog.title", { name: app.name })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Sync Frequency */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("apps.settings_dialog.frequency_label")}
            </Label>
            <Select
              value={syncFrequency}
              onValueChange={(val) => setSyncFrequency(val ?? "1440")}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYNC_FREQUENCY_VALUES.map((freq) => (
                  <SelectItem key={freq} value={String(freq)}>
                    {t(syncFrequencyLabelKey(freq))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {t("apps.settings_dialog.frequency_help", { name: app.name })}
            </p>
          </div>

          {/* Data Categories */}
          <div className="space-y-2">
            <Label className="text-xs">
              {t("apps.settings_dialog.categories_label")}
            </Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              {t("apps.settings_dialog.categories_help")}
            </p>
            <div className="space-y-2">
              {ALL_DATA_CATEGORY_CODES.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm">{t(dataCategoryLabelKey(cat))}</span>
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
            {t("apps.settings_dialog.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                {t("apps.settings_dialog.saving")}
              </>
            ) : (
              t("apps.settings_dialog.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
