"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { List, LayoutGrid, Calendar, Kanban, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ALL_VIEW_TYPES,
  VIEW_TYPE_LABELS,
  GLOBAL_BLOCK_SETTINGS_KEY,
  DEFAULT_BLOCK_PAGE_SETTINGS,
  parseBlockSettings,
  type BlockPageSettings,
  type ViewType,
} from "@/lib/blocks/block-settings";

const VIEW_ICONS: Record<ViewType, LucideIcon> = {
  list: List,
  card: LayoutGrid,
  calendar: Calendar,
  kanban: Kanban,
};

interface BlockSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlockSettingsDialog({
  open,
  onOpenChange,
}: BlockSettingsDialogProps) {
  const [settings, setSettings] = useState<BlockPageSettings>(
    DEFAULT_BLOCK_PAGE_SETTINGS,
  );
  const [saving, setSaving] = useState(false);

  // Load current settings when dialog opens
  useEffect(() => {
    if (open) {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((json) => {
          if (json.data?.[GLOBAL_BLOCK_SETTINGS_KEY]) {
            const parsed = parseBlockSettings(
              json.data[GLOBAL_BLOCK_SETTINGS_KEY],
            );
            if (parsed) {
              setSettings({ ...DEFAULT_BLOCK_PAGE_SETTINGS, ...parsed });
            }
          }
        })
        .catch(() => {});
    }
  }, [open]);

  function toggleView(view: string) {
    setSettings((prev) => {
      const views = prev.enabledViews.includes(view)
        ? prev.enabledViews.filter((v) => v !== view)
        : [...prev.enabledViews, view];
      // Ensure at least one view
      if (views.length === 0) return prev;
      // If default view was removed, pick first available
      const defaultView = views.includes(prev.defaultView)
        ? prev.defaultView
        : views[0];
      return { ...prev, enabledViews: views, defaultView };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [GLOBAL_BLOCK_SETTINGS_KEY]: JSON.stringify(settings),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Block settings updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save block settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Block Settings</DialogTitle>
          <DialogDescription>
            Configure global defaults for all block pages. Individual blocks can
            override these.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Available Views */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Available Views</h3>
            <div className="grid grid-cols-2 gap-2">
              {ALL_VIEW_TYPES.map((view) => {
                const Icon = VIEW_ICONS[view];
                const enabled = settings.enabledViews.includes(view);
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => toggleView(view)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                      enabled
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/20",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {VIEW_TYPE_LABELS[view]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default View */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Default View</h3>
            <Select
              value={settings.defaultView}
              onValueChange={(val) =>
                setSettings((prev) => ({ ...prev, defaultView: val }))
              }
            >
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settings.enabledViews.map((view) => (
                  <SelectItem key={view} value={view}>
                    {VIEW_TYPE_LABELS[view as ViewType] ?? view}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feature Toggles */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Features</h3>
            <div className="space-y-3">
              {(
                [
                  { key: "showStats", label: "Show stats cards" },
                  { key: "showSearch", label: "Show search bar" },
                  {
                    key: "enableBulkActions",
                    label: "Enable bulk actions",
                  },
                ] as const
              ).map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">{label}</span>
                  <Switch
                    checked={settings[key]}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        [key]: checked === true,
                      }))
                    }
                    size="sm"
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
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
