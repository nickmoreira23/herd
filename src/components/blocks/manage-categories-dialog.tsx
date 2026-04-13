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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronUp, ChevronDown, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { BlockCategory } from "@/lib/blocks/block-categories";
import {
  BLOCK_CATEGORIES_SETTING_KEY,
  CATEGORY_COLOR_PRESETS,
  DEFAULT_CATEGORY_COLOR,
} from "@/lib/blocks/block-categories";
import { BLOCK_ICON_MAP, BLOCK_LABEL_MAP } from "@/lib/blocks/block-meta";
import { cn } from "@/lib/utils";

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: BlockCategory[];
  onSave: (categories: BlockCategory[]) => void;
}

/** Collect every known block name from the icon map */
const ALL_BLOCKS = Object.keys(BLOCK_ICON_MAP);

/** Generate a simple unique id for new categories */
function makeId() {
  return `cat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  categories: initialCategories,
  onSave,
}: ManageCategoriesDialogProps) {
  const [cats, setCats] = useState<BlockCategory[]>([]);
  const [saving, setSaving] = useState(false);

  // Reset local state whenever the dialog opens
  useEffect(() => {
    if (open) {
      setCats(initialCategories.map((c) => ({ ...c, blocks: [...c.blocks] })));
    }
  }, [open, initialCategories]);

  // ---- Derived: uncategorized blocks ----
  const assignedBlocks = new Set(cats.flatMap((c) => c.blocks));
  const uncategorized = ALL_BLOCKS.filter((b) => !assignedBlocks.has(b));

  // ---- Category operations ----
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

  // ---- Block-within-category operations ----
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

  // ---- Save ----
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [BLOCK_CATEGORIES_SETTING_KEY]: JSON.stringify(cats),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSave(cats);
      toast.success("Categories updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save categories");
    } finally {
      setSaving(false);
    }
  }

  // ---- Render helpers ----
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Organize blocks into categories. Reorder, rename, or create new
            categories.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {/* ---- Category list ---- */}
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
                  onChange={(e) => renameCat(catIndex, e.target.value)}
                  className="h-8 flex-1 text-sm font-medium"
                  aria-label="Category name"
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={catIndex === 0}
                  onClick={() => moveCat(catIndex, -1)}
                  aria-label="Move category up"
                >
                  <ChevronUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={catIndex === cats.length - 1}
                  onClick={() => moveCat(catIndex, 1)}
                  aria-label="Move category down"
                >
                  <ChevronDown />
                </Button>
                <Button
                  variant="destructive"
                  size="icon-xs"
                  onClick={() => deleteCat(catIndex)}
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
                    onClick={() => updateCatColor(catIndex, preset)}
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

          {/* ---- Add category button ---- */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={addCat}
          >
            <Plus className="mr-1.5" />
            Add Category
          </Button>

          {/* ---- Uncategorized blocks ---- */}
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
                        onValueChange={(catId) =>
                          assignBlock(blockName, catId)
                        }
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

        <DialogFooter>
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
