"use client";

import { cn } from "@/lib/utils";
import type { ArtifactMeta } from "@/lib/chat/types";
import {
  FileText,
  Image,
  Video,
  Headphones,
  Link2,
  Table2,
  ClipboardList,
  Rss,
  Activity,
  Package,
  Bot,
  Gift,
  Users,
  Handshake,
} from "lucide-react";

const typeIcons: Record<string, typeof FileText> = {
  document: FileText,
  image: Image,
  video: Video,
  audio: Headphones,
  link: Link2,
  table: Table2,
  form: ClipboardList,
  rss: Rss,
  app_data: Activity,
  product: Package,
  agent: Bot,
  perk: Gift,
  community_benefit: Users,
  partner_brand: Handshake,
};

const typeLabelColors: Record<string, string> = {
  product: "text-emerald-600 dark:text-emerald-400",
  agent: "text-blue-600 dark:text-blue-400",
  partner_brand: "text-violet-600 dark:text-violet-400",
  perk: "text-amber-600 dark:text-amber-400",
  community_benefit: "text-cyan-600 dark:text-cyan-400",
  document: "text-zinc-500",
  image: "text-pink-600 dark:text-pink-400",
  video: "text-red-600 dark:text-red-400",
  audio: "text-orange-600 dark:text-orange-400",
  link: "text-sky-600 dark:text-sky-400",
  table: "text-teal-600 dark:text-teal-400",
  form: "text-indigo-600 dark:text-indigo-400",
  rss: "text-yellow-600 dark:text-yellow-400",
  app_data: "text-purple-600 dark:text-purple-400",
};

// All inline cards use a uniform dark gray border for a clean look
const CARD_BORDER = "border-zinc-300 dark:border-zinc-600";

const typeLabels: Record<string, string> = {
  product: "Product",
  agent: "AI Agent",
  partner_brand: "Partner",
  perk: "Perk",
  community_benefit: "Community",
  document: "Document",
  image: "Image",
  video: "Video",
  audio: "Audio",
  link: "Web Page",
  table: "Table",
  form: "Form",
  rss: "Article",
  app_data: "App Data",
};

function renderPrice(artifact: ArtifactMeta): React.ReactNode {
  const { type, meta } = artifact;
  if (type === "product") {
    const price = meta.memberPrice as number | undefined;
    const retailPrice = meta.retailPrice as number | undefined;
    const displayPrice = price ?? retailPrice;
    if (displayPrice != null) {
      return (
        <span className="font-semibold text-foreground">
          $ {Number(displayPrice).toFixed(2)}
        </span>
      );
    }
  }
  return null;
}

function renderSubtext(artifact: ArtifactMeta): string | null {
  const { type, meta } = artifact;
  switch (type) {
    case "agent": {
      const skillCount = meta.skillCount as number | undefined;
      const toolCount = meta.toolCount as number | undefined;
      const parts: string[] = [];
      if (artifact.category) parts.push(artifact.category);
      if (skillCount && skillCount > 0) parts.push(`${skillCount} skills`);
      if (toolCount && toolCount > 0) parts.push(`${toolCount} tools`);
      return parts.join(" - ") || null;
    }
    case "partner_brand":
      return (meta.audienceBenefit as string) || artifact.category || null;
    case "perk": {
      const tags = meta.tags as string[] | undefined;
      return tags && tags.length > 0 ? tags.slice(0, 3).join(", ") : null;
    }
    case "community_benefit":
      return (meta.platform as string) || null;
    case "link":
      return (meta.domain as string) || null;
    case "rss": {
      const pub = meta.publishedAt as string | undefined;
      return pub ? new Date(pub).toLocaleDateString() : null;
    }
    default:
      return null;
  }
}

interface InlineArtifactCardProps {
  artifact: ArtifactMeta;
  onClick?: () => void;
  isSelected?: boolean;
}

export function InlineArtifactCard({
  artifact,
  onClick,
  isSelected,
}: InlineArtifactCardProps) {
  const Icon = typeIcons[artifact.type] || FileText;
  const labelColor = typeLabelColors[artifact.type] || "text-muted-foreground";
  const label = typeLabels[artifact.type] || artifact.type;
  const hasImage =
    artifact.imageUrl &&
    ["product", "image", "video", "partner_brand"].includes(artifact.type);
  const price = renderPrice(artifact);
  const subtext = renderSubtext(artifact);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "flex w-full rounded-xl border bg-card overflow-hidden text-left transition-all hover:shadow-md my-3",
        CARD_BORDER,
        isSelected && "ring-2 ring-primary/30 shadow-md"
      )}
    >
      {/* Image section */}
      {hasImage && (
        <div className="w-28 shrink-0 bg-muted flex items-center justify-center overflow-hidden border-r border-border/50">
          <img
            src={artifact.imageUrl!}
            alt={artifact.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* No image — show icon placeholder */}
      {!hasImage && (
        <div className="w-16 shrink-0 bg-muted/50 flex items-center justify-center border-r border-border/50">
          <Icon className="h-6 w-6 text-muted-foreground/60" />
        </div>
      )}

      {/* Content section */}
      <div className="flex flex-col gap-1 p-3 min-w-0 flex-1">
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            labelColor
          )}
        >
          {label}
        </span>
        <span className="text-sm font-semibold leading-tight line-clamp-2">
          {artifact.name}
        </span>
        {artifact.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {artifact.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          {price}
          {price && (
            <span className="text-xs text-muted-foreground">-</span>
          )}
          {subtext && !price && (
            <span className="text-xs text-muted-foreground">{subtext}</span>
          )}
          <span className="text-xs text-muted-foreground/70">
            Click to open details
          </span>
        </div>
      </div>
    </button>
  );
}
