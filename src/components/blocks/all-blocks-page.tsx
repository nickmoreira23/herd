"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BLOCK_ICON_MAP, BLOCK_LABEL_MAP } from "@/lib/blocks/block-meta";
import type { BlockCategory } from "@/lib/blocks/block-categories";
import { DEFAULT_CATEGORY_COLOR, hexToRgba } from "@/lib/blocks/block-categories";

interface AllBlocksPageProps {
  initialCategories: BlockCategory[];
  counts: Record<string, number>;
}

export function AllBlocksPage({ initialCategories, counts }: AllBlocksPageProps) {
  const [categories] = useState(initialCategories);

  const totalBlocks = categories.reduce((sum, cat) => sum + cat.blocks.length, 0);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">All Blocks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalBlocks} blocks across {categories.length} categories
        </p>
      </div>

      {/* Category sections */}
      {categories.map((category) => {
        const catColor = category.color || DEFAULT_CATEGORY_COLOR;

        return (
          <div key={category.id}>
            <h2
              className="text-[13px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: catColor }}
            >
              {category.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {category.blocks.map((blockName) => {
                const Icon = BLOCK_ICON_MAP[blockName];
                const label = BLOCK_LABEL_MAP[blockName] || blockName;
                const count = counts[blockName] ?? 0;

                return (
                  <Link key={blockName} href={`/admin/blocks/${blockName}`}>
                    <Card className="transition-all cursor-pointer h-full hover:shadow-md">
                      <CardContent className="flex items-center gap-3 py-4">
                        <div
                          className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
                          style={{ backgroundColor: hexToRgba(catColor, 0.1) }}
                        >
                          {Icon && (
                            <Icon className="h-4 w-4" style={{ color: catColor }} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium truncate">{label}</h3>
                          <p className="text-xs text-muted-foreground">
                            {count.toLocaleString()} {count === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
