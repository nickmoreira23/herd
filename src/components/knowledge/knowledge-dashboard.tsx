"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { formatNumber } from "@/lib/i18n/format-number";
import { getBlockLabel } from "@/lib/blocks/block-labels";
import { BLOCK_ICON_MAP } from "@/lib/blocks/block-meta";

interface BlockInfo {
  name: string;
  href: string;
  count: number;
}

const BLOCK_HREF: Record<string, string> = {
  documents: "/admin/knowledge/documents",
  images: "/admin/knowledge/images",
  videos: "/admin/knowledge/videos",
  audios: "/admin/knowledge/audios",
  tables: "/admin/knowledge/tables",
  forms: "/admin/knowledge/forms",
  links: "/admin/knowledge/links",
  feeds: "/admin/knowledge/feeds",
  apps: "/admin/knowledge/apps",
};

const BLOCK_ORDER = [
  "documents",
  "images",
  "videos",
  "audios",
  "tables",
  "forms",
  "links",
  "feeds",
  "apps",
] as const;

interface KnowledgeDashboardProps {
  counts: Record<string, number>;
  enabledBlocks: string[];
}

export function KnowledgeDashboard({
  counts,
  enabledBlocks,
}: KnowledgeDashboardProps) {
  const t = useT();
  const locale = useLocale();
  const blocks: BlockInfo[] = BLOCK_ORDER
    .filter((b) => enabledBlocks.includes(b))
    .map((b) => ({
      name: b,
      href: BLOCK_HREF[b] ?? "#",
      count: counts[b] ?? 0,
    }));

  const totalItems = Object.values(counts).reduce((sum, c) => sum + c, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {t("knowledge.dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("knowledge.dashboard.summary", {
            total: formatNumber(totalItems, locale, "integer"),
            count: blocks.length,
          })}
        </p>
      </div>

      {/* Block Grid */}
      {blocks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings2 className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">
              {t("knowledge.dashboard.empty.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("knowledge.dashboard.empty.description")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((block) => {
            const Icon = BLOCK_ICON_MAP[block.name];
            return (
              <Link key={block.name} href={block.href}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="flex items-center gap-4 py-5">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0">
                      {Icon && <Icon className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium truncate">
                        {getBlockLabel(block.name, locale)}
                      </h3>
                      <p className="text-2xl font-bold tabular-nums">
                        {formatNumber(block.count, locale, "integer")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
