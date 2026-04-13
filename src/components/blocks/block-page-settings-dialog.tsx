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
  VIEW_TYPE_LABELS,
  blockSettingsKey,
  resolveBlockSettings,
  type BlockPageSettings,
  type ViewType,
} from "@/lib/blocks/block-settings";

const VIEW_ICONS: Record<string, LucideIcon> = {
  list: List,
  card: LayoutGrid,
  calendar: Calendar,
  kanban: Kanban,
};

interface BlockPageSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockName: string;
  blockTitle: string;
  /** View types this block supports (has renderers for) */
  supportedViews: string[];
  /** Current global settings (already fetched by parent) */
  globalSettings: Partial<BlockPageSettings> | null;
  /** Current per-block overrides (already fetched by parent) */
  currentOverrides: Partial<BlockPageSettings> | null;
  /** Called when overrides are saved */
  onSave: (overrides: Partial<BlockPageSettings> | null) => void;
}

export function BlockPageSettingsDialog({
  open,
  onOpenChange,
  blockName,
  blockTitle,
  supportedViews,
  globalSettings,
  currentOverrides,
  onSave,
}: BlockPageSettingsDialogProps) {
  const [overrides, setOverrides] = useState<Partial<BlockPageSettings>>({});
  const [saving, setSaving] = useState(false);

  // Resolved global settings (without per-block overrides)
  const globalResolved = resolveBlockSettings(globalSettings, null);

  // Views that are both supported by this block AND enabled globally
  const globallyAvailableViews = supportedViews.filter((v) =>
    globalResolved.enabledViews.includes(v),
  );

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setOverrides(currentOverrides ?? {});
    }
  }, [open, currentOverrides]);

  function hasOverride(key: keyof BlockPageSettings): boolean {
    return key in overrides && overrides[key] !== undefined;
  }

  function toggleViewOverride(view: string) {
    setOverrides((prev) => {
      const currentViews = prev.enabledViews ?? globallyAvailableViews;
      const newViews = currentViews.includes(view)
        ? currentViews.filter((v) => v !== view)
        : [...currentViews, view];
      // Ensure at least one view
      if (newViews.length === 0) return prev;
      // Fix default view if needed
      const defaultView =
        prev.defaultView && newViews.includes(prev.defaultView)
          ? prev.defaultView
          : newViews[0];
      return { ...prev, enabledViews: newViews, defaultView };
    });
  }

  function resetToDefaults() {
    setOverrides({});
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Only include keys that have actual overrides
      const cleanedOverrides: Partial<BlockPageSettings> = {};
      if (overrides.enabledViews)
        cleanedOverrides.enabledViews = overrides.enabledViews;
      if (overrides.defaultView)
        cleanedOverrides.defaultView = overrides.defaultView;
      if (overrides.showStats !== undefined)
        cleanedOverrides.showStats = overrides.showStats;
      if (overrides.showSearch !== undefined)
        cleanedOverrides.showSearch = overrides.showSearch;
      if (overrides.enableBulkActions !== undefined)
        cleanedOverrides.enableBulkActions = overrides.enableBulkActions;

      const hasAnyOverride = Object.keys(cleanedOverrides).length > 0;

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [blockSettingsKey(blockName)]: hasAnyOverride
            ? JSON.stringify(cleanedOverrides)
            : "",
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSave(hasAnyOverride ? cleanedOverrides : null);
      toast.success(`${blockTitle} settings updated`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const effectiveViews = overrides.enabledViews ?? globallyAvailableViews;
  const effectiveDefault =
    overrides.defaultView ?? globalResolved.defaultView;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{blockTitle} Settings</DialogTitle>
          <DialogDescription>
            Override global block settings for {blockTitle.toLowerCase()}.
            Unset options use the global default.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Views */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">
              Views{" "}
              <span className="text-muted-foreground font-normal">
                ({globallyAvailableViews.length} available globally)
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {globallyAvailableViews.map((view) => {
                const Icon = VIEW_ICONS[view];
                const enabled = effectiveViews.includes(view);
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => toggleViewOverride(view)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                      enabled
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/20",
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    {VIEW_TYPE_LABELS[view as ViewType] ?? view}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default View */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Default View
              {!hasOverride("defaultView") && (
                <span className="text-muted-foreground font-normal ml-1.5">
                  (global:{" "}
                  {VIEW_TYPE_LABELS[
                    globalResolved.defaultView as ViewType
                  ] ?? globalResolved.defaultView}
                  )
                </span>
              )}
            </h3>
            <Select
              value={effectiveDefault}
              onValueChange={(val) =>
                setOverrides((prev) => ({ ...prev, defaultView: val }))
              }
            >
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {effectiveViews.map((view) => (
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{label}</span>
                    {!hasOverride(key) && (
                      <span className="text-[11px] text-muted-foreground">
                        (global default)
                      </span>
                    )}
                  </div>
                  <Switch
                    checked={
                      overrides[key] !== undefined
                        ? (overrides[key] as boolean)
                        : globalResolved[key]
                    }
                    onCheckedChange={(checked) =>
                      setOverrides((prev) => ({
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

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button variant="ghost" size="sm" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
