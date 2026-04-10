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
  Calendar,
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
  meeting: Calendar,
};

const typeColors: Record<string, string> = {
  product: "border-l-emerald-500",
  agent: "border-l-blue-500",
  partner_brand: "border-l-violet-500",
  perk: "border-l-amber-500",
  community_benefit: "border-l-cyan-500",
  document: "border-l-zinc-400",
  image: "border-l-pink-500",
  video: "border-l-red-500",
  audio: "border-l-orange-500",
  link: "border-l-sky-500",
  table: "border-l-teal-500",
  form: "border-l-indigo-500",
  rss: "border-l-yellow-500",
  app_data: "border-l-purple-500",
  meeting: "border-l-green-500",
};

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
  meeting: "Meeting",
};

interface ArtifactCardProps {
  artifact: ArtifactMeta;
  onClick?: () => void;
  isSelected?: boolean;
}

function renderMeta(artifact: ArtifactMeta): React.ReactNode {
  const { type, meta } = artifact;

  switch (type) {
    case "product": {
      const price = meta.memberPrice as number | undefined;
      const brand = meta.brand as string | undefined;
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {brand && <span>{brand}</span>}
          {brand && price != null && <span>-</span>}
          {price != null && (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              ${Number(price).toFixed(2)}
            </span>
          )}
        </div>
      );
    }
    case "agent": {
      const skillCount = meta.skillCount as number | undefined;
      const toolCount = meta.toolCount as number | undefined;
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {artifact.category && <span>{artifact.category}</span>}
          {skillCount != null && skillCount > 0 && (
            <span>{skillCount} skills</span>
          )}
          {toolCount != null && toolCount > 0 && (
            <span>{toolCount} tools</span>
          )}
        </div>
      );
    }
    case "partner_brand": {
      const benefit = meta.audienceBenefit as string | undefined;
      return (
        <div className="text-xs text-muted-foreground line-clamp-1">
          {benefit || artifact.category}
        </div>
      );
    }
    case "perk": {
      const tags = meta.tags as string[] | undefined;
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {tags && tags.length > 0
            ? tags.slice(0, 3).join(", ")
            : artifact.status}
        </div>
      );
    }
    case "community_benefit": {
      const platform = meta.platform as string | undefined;
      return (
        <div className="text-xs text-muted-foreground">
          {platform && (
            <span className="capitalize">{platform}</span>
          )}
        </div>
      );
    }
    case "document": {
      const fileType = meta.fileType as string | undefined;
      return (
        <div className="text-xs text-muted-foreground">
          {fileType && <span className="uppercase">{fileType}</span>}
        </div>
      );
    }
    case "video":
    case "audio": {
      const duration = meta.duration as number | undefined;
      const fileType = meta.fileType as string | undefined;
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {fileType && <span className="uppercase">{fileType}</span>}
          {duration != null && (
            <span>{Math.round(duration)}s</span>
          )}
        </div>
      );
    }
    case "link": {
      const domain = meta.domain as string | undefined;
      const pages = meta.pagesScraped as number | undefined;
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {domain && <span>{domain}</span>}
          {pages != null && pages > 1 && <span>{pages} pages</span>}
        </div>
      );
    }
    case "table": {
      const records = meta.recordCount as number | undefined;
      const fields = meta.fieldCount as number | undefined;
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {records != null && <span>{records} records</span>}
          {fields != null && <span>{fields} fields</span>}
        </div>
      );
    }
    case "form": {
      const responses = meta.responseCount as number | undefined;
      return (
        <div className="text-xs text-muted-foreground">
          {responses != null && <span>{responses} responses</span>}
        </div>
      );
    }
    case "rss": {
      const publishedAt = meta.publishedAt as string | undefined;
      return (
        <div className="text-xs text-muted-foreground">
          {publishedAt && (
            <span>{new Date(publishedAt).toLocaleDateString()}</span>
          )}
        </div>
      );
    }
    case "app_data": {
      const appName = meta.appName as string | undefined;
      const date = meta.date as string | undefined;
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {appName && <span>{appName}</span>}
          {date && (
            <span>{new Date(date).toLocaleDateString()}</span>
          )}
        </div>
      );
    }
    case "meeting": {
      const duration = meta.duration as number | undefined;
      const platform = meta.platform as string | undefined;
      const participantCount = meta.participantCount as number | undefined;
      const date = meta.date as string | undefined;
      const platformLabels: Record<string, string> = {
        GOOGLE_MEET: "Google Meet", ZOOM: "Zoom", MICROSOFT_TEAMS: "Teams",
        IN_PERSON: "In-Person", OTHER: "Other",
      };
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {platform && <span>{platformLabels[platform] || platform}</span>}
          {duration != null && <span>{Math.round(duration / 60)}m</span>}
          {participantCount != null && participantCount > 0 && (
            <span>{participantCount} participants</span>
          )}
          {date && <span>{new Date(date).toLocaleDateString()}</span>}
        </div>
      );
    }
    default:
      return null;
  }
}

export function ArtifactCard({ artifact, onClick, isSelected }: ArtifactCardProps) {
  const Icon = typeIcons[artifact.type] || FileText;
  const colorClass = typeColors[artifact.type] || "border-l-zinc-400";
  const label = typeLabels[artifact.type] || artifact.type;
  const hasImage = artifact.imageUrl && ["product", "image", "video"].includes(artifact.type);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 w-full rounded-lg border border-l-[3px] bg-card p-3 text-left transition-all hover:shadow-md hover:border-border/80",
        colorClass,
        isSelected && "ring-2 ring-primary/30 shadow-md"
      )}
    >
      <div className="flex flex-1 min-w-0 gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="text-sm font-medium leading-tight line-clamp-2">
            {artifact.name}
          </span>
          {renderMeta(artifact)}
        </div>
      </div>
      {hasImage && (
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
          <img
            src={artifact.imageUrl!}
            alt={artifact.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </button>
  );
}
