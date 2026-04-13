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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Loader2,
  LayoutGrid,
  List,
  Calendar,
  Kanban,
  Settings2,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import type { BlockCategory } from "@/lib/blocks/block-categories";
import {
  BLOCK_CATEGORIES_SETTING_KEY,
  CATEGORY_COLOR_PRESETS,
  DEFAULT_CATEGORY_COLOR,
} from "@/lib/blocks/block-categories";
import { BLOCK_ICON_MAP, BLOCK_LABEL_MAP } from "@/lib/blocks/block-meta";
import {
  ALL_VIEW_TYPES,
  VIEW_TYPE_LABELS,
  GLOBAL_BLOCK_SETTINGS_KEY,
  DEFAULT_BLOCK_PAGE_SETTINGS,
  parseBlockSettings,
  type BlockPageSettings,
  type ViewType,
} from "@/lib/blocks/block-settings";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

type Page = "categories" | "settings";

interface ManageBlocksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: BlockCategory[];
  onSaveCategories: (categories: BlockCategory[]) => void;
}

// ─── Constants ─────────────────────────────────────────────────

const ALL_BLOCKS = Object.keys(BLOCK_ICON_MAP);

const VIEW_ICONS: Record<ViewType, LucideIcon> = {
  list: List,
  card: LayoutGrid,
  calendar: Calendar,
  kanban: Kanban,
};

const PAGES: { key: Page; label: string; icon: LucideIcon }[] = [
  { key: "categories", label: "Categories", icon: Layers },
  { key: "settings", label: "Settings", icon: Settings2 },
];

function makeId() {
  return `cat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Component ─────────────────────────────────────────────────

export function ManageBlocksDialog({
  open,
  onOpenChange,
  categories: initialCategories,
  onSaveCategories,
}: ManageBlocksDialogProps) {
  const [activePage, setActivePage] = useState<Page>("categories");
  const [saving, setSaving] = useState(false);

  // ── Categories state ──
  const [cats, setCats] = useState<BlockCategory[]>([]);

  // ── Settings state ──
  const [settings, setSettings] = useState<BlockPageSettings>(
    DEFAULT_BLOCK_PAGE_SETTINGS,
  );

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setCats(initialCategories.map((c) => ({ ...c, blocks: [...c.blocks] })));
      setActivePage("categories");

      // Load block settings
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
  }, [open, initialCategories]);

  // ── Categories derived ──
  const assignedBlocks = new Set(cats.flatMap((c) => c.blocks));
  const uncategorized = ALL_BLOCKS.filter((b) => !assignedBlocks.has(b));

  // ── Category operations ──
  function moveCat(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= cats.length) return;
    setCats((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function renameCat(index: number, label: string) {
    setCats((prev) => prev.map((c, i) => (i === index ? { ...c, label } : c)));
  }

  function deleteCat(index: number) {
    setCats((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCatColor(index: number, color: string) {
    setCats((prev) =>
      prev.map((c, i) => (i === index ? { ...c, color } : c)),
    );
  }

  function addCat() {
    const usedColors = new Set(cats.map((c) => c.color));
    const nextColor =
      CATEGORY_COLOR_PRESETS.find((c) => !usedColors.has(c)) ||
      CATEGORY_COLOR_PRESETS[0];
    setCats((prev) => [
      ...prev,
      { id: makeId(), label: "New Category", color: nextColor, blocks: [] },
    ]);
  }

  function moveBlock(catIndex: number, blockIndex: number, direction: -1 | 1) {
    const target = blockIndex + direction;
    setCats((prev) =>
      prev.map((c, ci) => {
        if (ci !== catIndex) return c;
        if (target < 0 || target >= c.blocks.length) return c;
        const blocks = [...c.blocks];
        [blocks[blockIndex], blocks[target]] = [blocks[target], blocks[blockIndex]];
        return { ...c, blocks };
      }),
    );
  }

  function removeBlockFromCat(catIndex: number, blockName: string) {
    setCats((prev) =>
      prev.map((c, ci) =>
        ci === catIndex
          ? { ...c, blocks: c.blocks.filter((b) => b !== blockName) }
          : c,
      ),
    );
  }

  function assignBlock(blockName: string, catId: string) {
    setCats((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, blocks: [...c.blocks, blockName] } : c,
      ),
    );
  }

  // ── Settings operations ──
  function toggleView(view: string) {
    setSettings((prev) => {
      const views = prev.enabledViews.includes(view)
        ? prev.enabledViews.filter((v) => v !== view)
        : [...prev.enabledViews, view];
      if (views.length === 0) return prev;
      const defaultView = views.includes(prev.defaultView)
        ? prev.defaultView
        : views[0];
      return { ...prev, enabledViews: views, defaultView };
    });
  }

  // ── Save all ──
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [BLOCK_CATEGORIES_SETTING_KEY]: JSON.stringify(cats),
          [GLOBAL_BLOCK_SETTINGS_KEY]: JSON.stringify(settings),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaveCategories(cats);
      toast.success("Block configuration saved");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ── Block row render helper ──
  function renderBlockRow(
    blockName: string,
    catIndex: number,
    blockIndex: number,
    total: number,
  ) {
    const Icon = BLOCK_ICON_MAP[blockName];
    const label = BLOCK_LABEL_MAP[blockName] ?? blockName;

    return (
      <div
        key={blockName}
        className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2 py-1"
      >
        {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
        <span className="flex-1 truncate text-xs">{label}</span>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={blockIndex === 0}
          onClick={() => moveBlock(catIndex, blockIndex, -1)}
          aria-label="Move block up"
        >
          <ChevronUp />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={blockIndex === total - 1}
          onClick={() => moveBlock(catIndex, blockIndex, 1)}
          aria-label="Move block down"
        >
          <ChevronDown />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => removeBlockFromCat(catIndex, blockName)}
          aria-label="Remove block from category"
        >
          <X />
        </Button>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle>Blocks</DialogTitle>
          <DialogDescription>
            Organize blocks into categories and configure global block page
            defaults.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[420px] max-h-[65vh]">
          {/* Left sidebar nav */}
          <nav className="w-[160px] shrink-0 border-r bg-muted/30 p-3 space-y-0.5">
            {PAGES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActivePage(key)}
                className={cn(
                  "flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
                  activePage === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* Right content area */}
          <div className="flex-1 overflow-y-auto p-5">
            {activePage === "categories" && (
              <CategoriesContent
                cats={cats}
                uncategorized={uncategorized}
                onMoveCat={moveCat}
                onRenameCat={renameCat}
                onDeleteCat={deleteCat}
                onUpdateCatColor={updateCatColor}
                onAddCat={addCat}
                onAssignBlock={assignBlock}
                renderBlockRow={renderBlockRow}
              />
            )}

            {activePage === "settings" && (
              <SettingsContent
                settings={settings}
                onToggleView={toggleView}
                onSetSettings={setSettings}
              />
            )}
          </div>
        </div>

        <DialogFooter className="rounded-b-xl">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Categories Page ───────────────────────────────────────────

function CategoriesContent({
  cats,
  uncategorized,
  onMoveCat,
  onRenameCat,
  onDeleteCat,
  onUpdateCatColor,
  onAddCat,
  onAssignBlock,
  renderBlockRow,
}: {
  cats: BlockCategory[];
  uncategorized: string[];
  onMoveCat: (index: number, direction: -1 | 1) => void;
  onRenameCat: (index: number, label: string) => void;
  onDeleteCat: (index: number) => void;
  onUpdateCatColor: (index: number, color: string) => void;
  onAddCat: () => void;
  onAssignBlock: (blockName: string, catId: string) => void;
  renderBlockRow: (
    blockName: string,
    catIndex: number,
    blockIndex: number,
    total: number,
  ) => React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {cats.map((cat, catIndex) => (
        <div
          key={cat.id}
          className="space-y-2 rounded-lg border p-3"
          style={{
            borderLeftWidth: 3,
            borderLeftColor: cat.color || DEFAULT_CATEGORY_COLOR,
          }}
        >
          {/* Category header */}
          <div className="flex items-center gap-1.5">
            <Input
              value={cat.label}
              onChange={(e) => onRenameCat(catIndex, e.target.value)}
              className="h-8 flex-1 text-sm font-medium"
              aria-label="Category name"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={catIndex === 0}
              onClick={() => onMoveCat(catIndex, -1)}
              aria-label="Move category up"
            >
              <ChevronUp />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={catIndex === cats.length - 1}
              onClick={() => onMoveCat(catIndex, 1)}
              aria-label="Move category down"
            >
              <ChevronDown />
            </Button>
            <Button
              variant="destructive"
              size="icon-xs"
              onClick={() => onDeleteCat(catIndex)}
              aria-label="Delete category"
            >
              <X />
            </Button>
          </div>

          {/* Color presets */}
          <div className="flex flex-wrap items-center gap-1 px-0.5">
            {CATEGORY_COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={cn(
                  "h-4 w-4 rounded-full border-2 transition-all shrink-0",
                  (cat.color || DEFAULT_CATEGORY_COLOR) === preset
                    ? "border-foreground scale-110"
                    : "border-transparent hover:border-foreground/40",
                )}
                style={{ backgroundColor: preset }}
                onClick={() => onUpdateCatColor(catIndex, preset)}
                aria-label={`Set color to ${preset}`}
              />
            ))}
          </div>

          {/* Blocks in this category */}
          {cat.blocks.length > 0 ? (
            <div className="space-y-1">
              {cat.blocks.map((blockName, bi) =>
                renderBlockRow(blockName, catIndex, bi, cat.blocks.length),
              )}
            </div>
          ) : (
            <p className="px-1 text-xs text-muted-foreground">
              No blocks in this category
            </p>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full" onClick={onAddCat}>
        <Plus className="mr-1.5" />
        Add Category
      </Button>

      {uncategorized.length > 0 && (
        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Uncategorized
          </p>
          <div className="space-y-1.5">
            {uncategorized.map((blockName) => {
              const Icon = BLOCK_ICON_MAP[blockName];
              const label = BLOCK_LABEL_MAP[blockName] ?? blockName;

              return (
                <div
                  key={blockName}
                  className="flex items-center gap-2 rounded-md bg-muted/30 px-2 py-1"
                >
                  {Icon && (
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="flex-1 truncate text-xs">{label}</span>
                  <Select
                    onValueChange={(catId) => onAssignBlock(blockName, catId)}
                  >
                    <SelectTrigger
                      className="h-7 w-auto min-w-[6rem] text-xs"
                      size="sm"
                    >
                      <SelectValue placeholder="Move to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Page ─────────────────────────────────────────────

function SettingsContent({
  settings,
  onToggleView,
  onSetSettings,
}: {
  settings: BlockPageSettings;
  onToggleView: (view: string) => void;
  onSetSettings: React.Dispatch<React.SetStateAction<BlockPageSettings>>;
}) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Global defaults for all block pages. Individual blocks can override
        these.
      </p>

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
                onClick={() => onToggleView(view)}
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
            onSetSettings((prev) => ({ ...prev, defaultView: val }))
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
              { key: "enableBulkActions", label: "Enable bulk actions" },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <Switch
                checked={settings[key]}
                onCheckedChange={(checked) =>
                  onSetSettings((prev) => ({
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
  );
}
