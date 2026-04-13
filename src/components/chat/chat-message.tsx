"use client";

import { cn } from "@/lib/utils";
import { Bot, User, FileText, Image, Video, Headphones, Link2, Table2, ClipboardList, Rss, Activity, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import type { ArtifactMeta } from "@/lib/chat/types";
import { InlineArtifactCard } from "./artifacts/inline-artifact-card";
import { ThinkingSteps, type ThinkingStep } from "./thinking-steps";
import { ActivityFeed, type ActivityItem } from "@/components/agents/shared/activity-feed";

interface Source {
  type: string;
  id: string;
  name: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[] | null;
  artifacts?: ArtifactMeta[] | null;
  steps?: ThinkingStep[] | null;
  activities?: ActivityItem[] | null;
  isStreaming?: boolean;
  onArtifactClick?: (artifact: ArtifactMeta) => void;
  selectedArtifactId?: string | null;
}

const sourceIcons: Record<string, typeof FileText> = {
  document: FileText,
  image: Image,
  video: Video,
  audio: Headphones,
  link: Link2,
  table: Table2,
  form: ClipboardList,
  rss_article: Rss,
  app_data: Activity,
};

export function ChatMessage({ role, content, sources, artifacts, steps, activities, isStreaming, onArtifactClick, selectedArtifactId }: ChatMessageProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isUser = role === "user";
  const hasArtifacts = artifacts && artifacts.length > 0;
  const hasSteps = steps && steps.length > 0;
  const hasActivities = activities && activities.length > 0;

  // Build a map of artifacts by their full ID for inline lookup
  const artifactMap = useMemo(() => {
    if (!artifacts) return new Map<string, ArtifactMeta>();
    const map = new Map<string, ArtifactMeta>();
    for (const a of artifacts) {
      map.set(a.id, a);
    }
    return map;
  }, [artifacts]);

  const hasSourcesOnly = !hasArtifacts && sources && sources.length > 0;

  return (
    <div className={cn("flex gap-3 py-4", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn("flex flex-col gap-2 max-w-[80%] min-w-0 overflow-hidden", isUser && "items-end")}>
        {/* Persisted thinking steps (collapsed) for completed messages */}
        {hasSteps && !isStreaming && (
          <ThinkingSteps steps={steps} isStreaming={false} />
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words overflow-hidden",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-md"
              : "bg-muted rounded-tl-md"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <MessageContent
                content={content}
                artifactMap={artifactMap}
                onArtifactClick={onArtifactClick}
                selectedArtifactId={selectedArtifactId}
              />
            </div>
          )}
          {isStreaming && (
            <span className="inline-block w-[2px] h-[1.1em] ml-0.5 -mb-[1px] bg-foreground animate-caret-blink" />
          )}
        </div>

        {/* Activity feed for messages that triggered mutations */}
        {hasActivities && !isStreaming && (
          <ActivityFeed items={activities} />
        )}

        {/* Fallback: old-style source badges for messages without artifacts */}
        {hasSourcesOnly && (
          <div className="w-full">
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  sourcesOpen && "rotate-180"
                )}
              />
              {sources.length} source{sources.length !== 1 ? "s" : ""} referenced
            </button>
            {sourcesOpen && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {sources.map((source) => {
                  const Icon = sourceIcons[source.type] || FileText;
                  return (
                    <span
                      key={source.id}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                    >
                      <Icon className="h-3 w-3" />
                      {source.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface MessageContentProps {
  content: string;
  artifactMap?: Map<string, ArtifactMeta>;
  onArtifactClick?: (artifact: ArtifactMeta) => void;
  selectedArtifactId?: string | null;
}

function MessageContent({ content, artifactMap, onArtifactClick, selectedArtifactId }: MessageContentProps) {
  // Simple markdown-like rendering for assistant messages
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let codeKey = 0;

  // Regex for inline artifact markers: [[artifact:type:id]]
  const artifactPattern = /^\[\[artifact:([^\]]+)\]\]$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${codeKey++}`} className="rounded-md bg-background/50 p-3 overflow-x-auto text-xs">
            <code>{codeContent.trimEnd()}</code>
          </pre>
        );
        codeContent = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    // Check for artifact marker line
    const artifactMatch = line.trim().match(artifactPattern);
    if (artifactMatch && artifactMap) {
      const artifactId = artifactMatch[1];
      const artifact = artifactMap.get(artifactId);
      if (artifact) {
        elements.push(
          <InlineArtifactCard
            key={`artifact-${i}`}
            artifact={artifact}
            onClick={() => onArtifactClick?.(artifact)}
            isSelected={selectedArtifactId === artifact.id}
          />
        );
        continue;
      }
      // If artifact not found in map, skip the marker line silently
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(<h4 key={i} className="font-semibold mt-3 mb-1">{formatInline(line.slice(4))}</h4>);
    } else if (line.startsWith("## ")) {
      elements.push(<h3 key={i} className="font-semibold text-base mt-3 mb-1">{formatInline(line.slice(3))}</h3>);
    } else if (line.startsWith("# ")) {
      elements.push(<h2 key={i} className="font-bold text-base mt-3 mb-1">{formatInline(line.slice(2))}</h2>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2">
          <span className="text-muted-foreground">•</span>
          <span>{formatInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        elements.push(
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-muted-foreground">{match[1]}.</span>
            <span>{formatInline(match[2])}</span>
          </div>
        );
      }
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i}>{formatInline(line)}</p>);
    }
  }

  // Handle unclosed code block
  if (inCodeBlock && codeContent) {
    elements.push(
      <pre key={`code-${codeKey}`} className="rounded-md bg-background/50 p-3 overflow-x-auto text-xs">
        <code>{codeContent.trimEnd()}</code>
      </pre>
    );
  }

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  // Handle **bold**, *italic*, `code`, and [links]
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/);

    const candidates: { index: number; length: number; node: React.ReactNode }[] = [];

    if (boldMatch && boldMatch.index != null) {
      candidates.push({
        index: boldMatch.index,
        length: boldMatch[0].length,
        node: <strong key={`b-${key++}`}>{boldMatch[1]}</strong>,
      });
    }

    if (codeMatch && codeMatch.index != null) {
      candidates.push({
        index: codeMatch.index,
        length: codeMatch[0].length,
        node: (
          <code key={`c-${key++}`} className="rounded bg-background/50 px-1 py-0.5 text-xs">
            {codeMatch[1]}
          </code>
        ),
      });
    }

    const firstMatch = candidates.sort((a, b) => a.index - b.index)[0] ?? null;

    if (firstMatch) {
      if (firstMatch.index > 0) {
        parts.push(remaining.slice(0, firstMatch.index));
      }
      parts.push(firstMatch.node);
      remaining = remaining.slice(firstMatch.index + firstMatch.length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
