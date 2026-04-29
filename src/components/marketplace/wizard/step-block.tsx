"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketplaceWizardStore } from "@/stores/marketplace-section-wizard-store";
import type { EligibleBlock } from "@/lib/marketplace/types";
import {
  BLOCK_ICON_MAP,
  BLOCK_LABEL_MAP,
} from "@/lib/blocks/block-meta";
import {
  type BlockCategory,
  DEFAULT_CATEGORY_COLOR,
  hexToRgba,
} from "@/lib/blocks/block-categories";

interface Props {
  eligibleBlocks: EligibleBlock[];
  categories: BlockCategory[];
  onNext: () => void;
}

export function StepBlock({ eligibleBlocks, categories, onNext }: Props) {
  const router = useRouter();
  const { selectedBlockNames, toggleBlock } = useMarketplaceWizardStore();
  const canProceed = selectedBlockNames.length > 0;

  // Index eligible blocks by name for O(1) lookups while iterating categories.
  const blockByName = useMemo(() => {
    const map = new Map<string, EligibleBlock>();
    for (const b of eligibleBlocks) map.set(b.name, b);
    return map;
  }, [eligibleBlocks]);

  // Group: only render category sections that contain ≥1 eligible block,
  // and capture any blocks that aren't assigned to a category in a
  // trailing "Other" group so we never silently lose a registered block.
  const groups = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ category: BlockCategory; blocks: EligibleBlock[] }> = [];
    for (const cat of categories) {
      const blocks: EligibleBlock[] = [];
      for (const name of cat.blocks) {
        const block = blockByName.get(name);
        if (block) {
          blocks.push(block);
          seen.add(name);
        }
      }
      if (blocks.length > 0) out.push({ category: cat, blocks });
    }
    const orphans = eligibleBlocks.filter((b) => !seen.has(b.name));
    if (orphans.length > 0) {
      out.push({
        category: {
          id: "_other",
          label: "Outros",
          color: DEFAULT_CATEGORY_COLOR,
          blocks: orphans.map((b) => b.name),
        },
        blocks: orphans,
      });
    }
    return out;
  }, [categories, blockByName, eligibleBlocks]);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Pick the blocks for this section</h2>
          <p className="text-sm text-muted-foreground mt-1">
            A section can pull from one or more blocks. You&apos;ll choose which items in the
            next step.
          </p>
        </div>

        <div className="space-y-6">
          {groups.map(({ category, blocks }) => {
            const color = category.color ?? DEFAULT_CATEGORY_COLOR;
            return (
              <div key={category.id}>
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                  style={{ color }}
                >
                  {category.label}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {blocks.map((b) => {
                    const Icon = BLOCK_ICON_MAP[b.name] ?? Layers;
                    const label = BLOCK_LABEL_MAP[b.name] ?? b.displayName;
                    const selected = selectedBlockNames.includes(b.name);
                    return (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => toggleBlock(b.name)}
                        className={cn(
                          "relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all hover:shadow-sm",
                          !selected && "border-border bg-card hover:border-foreground/20"
                        )}
                        style={
                          selected
                            ? {
                                borderColor: color,
                                backgroundColor: hexToRgba(color, 0.08),
                              }
                            : undefined
                        }
                      >
                        {selected && (
                          <div
                            className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: color }}
                          >
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div
                          className="h-12 w-12 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: hexToRgba(color, selected ? 0.2 : 0.12),
                          }}
                        >
                          <Icon className="h-6 w-6" style={{ color }} />
                        </div>
                        <p className="text-sm font-semibold text-center">{label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button variant="ghost" onClick={() => router.push("/admin/marketplace")}>
          Cancel
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          <ArrowRight className="h-4 w-4 mr-2" /> Next: Items
        </Button>
      </div>
    </div>
  );
}
