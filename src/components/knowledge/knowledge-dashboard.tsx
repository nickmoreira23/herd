"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Image,
  Video,
  Music,
  Table2,
  ClipboardList,
  Link2,
  Rss,
  Plug,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KnowledgeSettingsDialog } from "./knowledge-settings-dialog";

interface BlockInfo {
  name: string;
  label: string;
  icon: LucideIcon;
  href: string;
  count: number;
}

const BLOCK_CONFIG: Array<{
  name: string;
  label: string;
  icon: LucideIcon;
  href: string;
}> = [
  { name: "documents", label: "Documents", icon: FileText, href: "/admin/organization/knowledge" },
  { name: "images", label: "Images", icon: Image, href: "/admin/organization/knowledge/images" },
  { name: "videos", label: "Videos", icon: Video, href: "/admin/organization/knowledge/videos" },
  { name: "audios", label: "Audios", icon: Music, href: "/admin/organization/knowledge/audios" },
  { name: "tables", label: "Tables", icon: Table2, href: "/admin/organization/knowledge/tables" },
  { name: "forms", label: "Forms", icon: ClipboardList, href: "/admin/organization/knowledge/forms" },
  { name: "links", label: "Links", icon: Link2, href: "/admin/organization/knowledge/links" },
  { name: "feeds", label: "Feeds", icon: Rss, href: "/admin/organization/knowledge/feeds" },
  { name: "apps", label: "Apps", icon: Plug, href: "/admin/organization/knowledge/apps" },
];

interface KnowledgeDashboardProps {
  counts: Record<string, number>;
  enabledBlocks: string[];
}

export function KnowledgeDashboard({ counts, enabledBlocks: initial }: KnowledgeDashboardProps) {
  const [enabledBlocks, setEnabledBlocks] = useState<string[]>(initial);
  const [showSettings, setShowSettings] = useState(false);

  const blocks: BlockInfo[] = BLOCK_CONFIG
    .filter((b) => enabledBlocks.includes(b.name))
    .map((b) => ({ ...b, count: counts[b.name] ?? 0 }));

  const totalItems = Object.values(counts).reduce((sum, c) => sum + c, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalItems.toLocaleString()} total items across {blocks.length} content types
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(true)}
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </div>

      {/* Block Grid */}
      {blocks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings2 className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No content types enabled</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enable content types to start building your knowledge base.
            </p>
            <Button variant="default" onClick={() => setShowSettings(true)}>
              Configure Knowledge Types
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((block) => (
            <Link key={block.name} href={block.href}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="flex items-center gap-4 py-5">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0">
                    <block.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium truncate">{block.label}</h3>
                    <p className="text-2xl font-bold tabular-nums">{block.count.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Settings Dialog */}
      <KnowledgeSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        enabledBlocks={enabledBlocks}
        onSave={setEnabledBlocks}
      />
    </div>
  );
}
