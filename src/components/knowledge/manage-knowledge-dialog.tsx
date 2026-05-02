"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Minus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BLOCK_ICON_MAP } from "@/lib/blocks/block-meta";
import { getBlockLabel, getCategoryLabel } from "@/lib/blocks/block-labels";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import type { BlockCategory } from "@/lib/blocks/block-categories";
import { DEFAULT_CATEGORY_COLOR } from "@/lib/blocks/block-categories";
import {
  KNOWLEDGE_BLOCKS_SETTING_KEY,
  KNOWLEDGE_FALLBACK_CATEGORY_ID,
  groupSelectedSources,
} from "@/lib/knowledge-commons/constants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current Knowledge selection (flat set of block names). */
  value: ReadonlySet<string>;
  /** All available block categories (source of truth for grouping + order). */
  categories: BlockCategory[];
  /** All block names registered in the app (the pool to pick from). */
  allBlockNames: string[];
  /** Called with the new selection after a successful save. */
  onSave: (next: Set<string>) => void;
}

export function ManageKnowledgeDialog({
  open,
  onOpenChange,
  value,
  categories,
  allBlockNames,
  onSave,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const [selected, setSelected] = useState<Set<string>>(new Set(value));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setSelected(new Set(value));
  }, [open, value]);

  const categoryLabel = (id: string) =>
    id === KNOWLEDGE_FALLBACK_CATEGORY_ID
      ? t("knowledge.manage.fallback_category")
      : getCategoryLabel(id, locale);

  const categoryColor = (id: string) =>
    categories.find((c) => c.id === id)?.color ?? DEFAULT_CATEGORY_COLOR;

  /**
   * Available column — same global category order, blocks in `cat.blocks`
   * order, filtered to those NOT yet selected. Mirrors how Selected sources
   * is rendered so both columns stay consistent with the Blocks tool.
   */
  const availableGroups = useMemo(() => {
    const allSet = new Set(allBlockNames);
    const placed = new Set<string>();
    const groups: Array<{ categoryId: string; blocks: string[] }> = [];

    for (const cat of categories) {
      const blocks = cat.blocks.filter(
        (b) => allSet.has(b) && !selected.has(b)
      );
      blocks.forEach((b) => placed.add(b));
      if (blocks.length > 0) {
        groups.push({ categoryId: cat.id, blocks });
      }
    }

    const orphans = allBlockNames.filter(
      (b) => !selected.has(b) && !placed.has(b)
    );
    if (orphans.length > 0) {
      groups.push({
        categoryId: KNOWLEDGE_FALLBACK_CATEGORY_ID,
        blocks: orphans,
      });
    }

    return groups;
  }, [allBlockNames, categories, selected]);

  const selectedGroups = useMemo(
    () => groupSelectedSources(selected, categories),
    [selected, categories]
  );

  const noneAvailable = availableGroups.length === 0;
  const noneSelected = selectedGroups.length === 0;

  function addBlock(blockName: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(blockName);
      return next;
    });
  }

  function removeBlock(blockName: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(blockName);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [KNOWLEDGE_BLOCKS_SETTING_KEY]: JSON.stringify([...selected]),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSave(new Set(selected));
      notifySuccess("knowledge.manage.feedback.saved", t);
      onOpenChange(false);
    } catch {
      notifyError("error.knowledge.manage.save_failed" as MessageKey, t);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("knowledge.manage.title")}</DialogTitle>
          <DialogDescription>
            {t("knowledge.manage.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh]">
          {/* Available sources */}
          <div className="flex flex-col min-h-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
              {t("knowledge.manage.available_sources")}
            </p>
            <div className="flex-1 overflow-y-auto rounded-md border bg-background/50 p-2 space-y-3">
              {noneAvailable && (
                <p className="text-xs text-muted-foreground italic px-2 py-3 text-center">
                  {t("knowledge.manage.all_added")}
                </p>
              )}
              {availableGroups.map((group) => (
                <CategoryGroup
                  key={group.categoryId}
                  label={categoryLabel(group.categoryId)}
                  blocks={group.blocks}
                  locale={locale}
                  action="add"
                  onAction={addBlock}
                  color={categoryColor(group.categoryId)}
                  addTitle={t("knowledge.manage.action.add")}
                  removeTitle={t("knowledge.manage.action.remove")}
                />
              ))}
            </div>
          </div>

          {/* Selected sources */}
          <div className="flex flex-col min-h-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
              {t("knowledge.manage.selected_sources")}
            </p>
            <div className="flex-1 overflow-y-auto rounded-md border bg-background/50 p-2 space-y-3">
              {noneSelected && (
                <p className="text-xs text-muted-foreground italic px-2 py-3 text-center">
                  {t("knowledge.manage.none_selected")}
                </p>
              )}
              {selectedGroups.map((group) => (
                <CategoryGroup
                  key={group.categoryId}
                  label={categoryLabel(group.categoryId)}
                  blocks={group.blocks}
                  locale={locale}
                  action="remove"
                  onAction={removeBlock}
                  addTitle={t("knowledge.manage.action.add")}
                  removeTitle={t("knowledge.manage.action.remove")}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t("common.actions.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("common.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryGroup({
  label,
  blocks,
  locale,
  action,
  onAction,
  color,
  addTitle,
  removeTitle,
}: {
  label: string;
  blocks: string[];
  locale: Locale;
  action: "add" | "remove";
  onAction: (blockName: string) => void;
  /** When set, header label and block icons inherit this hex color. */
  color?: string;
  addTitle: string;
  removeTitle: string;
}) {
  return (
    <div>
      <p
        className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider"
        style={color ? { color } : undefined}
      >
        {label}
      </p>
      <div className="space-y-0.5">
        {blocks.map((name) => {
          const Icon = BLOCK_ICON_MAP[name];
          return (
            <div
              key={name}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
            >
              {Icon && (
                <Icon
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  style={color ? { color } : undefined}
                />
              )}
              <span className="flex-1 text-sm truncate text-muted-foreground">
                {getBlockLabel(name, locale)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => onAction(name)}
                title={action === "add" ? addTitle : removeTitle}
              >
                {action === "add" ? (
                  <Plus className="h-3.5 w-3.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
