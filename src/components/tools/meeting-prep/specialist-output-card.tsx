"use client";

import { useState } from "react";
import {
  Loader2,
  Pin,
  PinOff,
  RefreshCw,
  Trash2,
  Wrench,
  ChevronDown,
} from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TOOL_ICON_MAP } from "@/lib/tools/category-meta";
import { cn } from "@/lib/utils";
import { getTemplate } from "@/lib/meeting-prep/specialist-templates";
import type { SpecialistActivation } from "@/lib/meeting-prep/types";

interface SpecialistOutputCardProps {
  activation: SpecialistActivation;
  onRegenerate: () => void;
  onTogglePin: () => void;
  onRemove: () => void;
}

export function SpecialistOutputCard({
  activation,
  onRegenerate,
  onTogglePin,
  onRemove,
}: SpecialistOutputCardProps) {
  const t = useT();
  const [showSources, setShowSources] = useState(false);

  const template = activation.templateId
    ? getTemplate(activation.templateId)
    : null;
  const Icon = template ? TOOL_ICON_MAP[template.icon] ?? Wrench : Wrench;
  const color = template?.color ?? "#8b5cf6";
  const isInspired = activation.kind === "inspired";
  const streaming = activation.status === "streaming";
  const queued = activation.status === "queued";
  const complete = activation.status === "complete";

  const headerLabel = isInspired
    ? t("meeting_prep.specialists.inspired.style_prefix", {
        name: activation.displayName,
      })
    : activation.displayName;

  return (
    <article
      className={cn(
        "rounded-xl border bg-card flex flex-col overflow-hidden",
        activation.pinned && "border-violet-500 ring-1 ring-violet-500/30",
      )}
    >
      <header className="flex items-start gap-3 p-4 pb-3 border-b">
        <div
          className="rounded-lg p-2.5 shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm leading-tight truncate">
              {headerLabel}
            </h3>
            {activation.pinned && (
              <Badge
                variant="default"
                className="bg-violet-600 hover:bg-violet-600 text-[9px] uppercase tracking-wider px-1.5 py-0"
              >
                <Pin className="h-2.5 w-2.5 mr-1" />
                Pinned
              </Badge>
            )}
            <span
              className={cn(
                "text-[10px] uppercase tracking-wider font-semibold ml-auto shrink-0",
                streaming
                  ? "text-violet-600"
                  : queued
                    ? "text-muted-foreground"
                    : complete
                      ? "text-emerald-600"
                      : "text-red-500",
              )}
            >
              {streaming ? (
                <>
                  <Loader2 className="h-2.5 w-2.5 inline mr-1 animate-spin" />
                  {t("meeting_prep.specialists.streaming")}
                </>
              ) : queued ? (
                t("meeting_prep.specialists.queued")
              ) : complete ? (
                t("meeting_prep.specialists.complete")
              ) : (
                t("meeting_prep.specialists.error")
              )}
            </span>
          </div>
          {template?.lens && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {template.lens}
            </p>
          )}
          {activation.kind === "custom" && activation.customDescription && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">
              &ldquo;{activation.customDescription}&rdquo;
            </p>
          )}
        </div>
      </header>

      {isInspired && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
          ⚠️ {t("meeting_prep.specialists.inspired.disclaimer", {
            name: activation.displayName,
          })}
        </div>
      )}

      <div className="p-4 space-y-4 text-sm flex-1">
        {/* Situation */}
        <Section
          label={t("meeting_prep.specialists.section.situation")}
          show={!!activation.output.situationRead}
        >
          <p className="leading-relaxed">{activation.output.situationRead}</p>
        </Section>

        {/* Priorities */}
        <Section
          label={t("meeting_prep.specialists.section.priorities")}
          show={activation.output.priorities.length > 0}
        >
          <ul className="space-y-1">
            {activation.output.priorities.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-violet-600 font-semibold shrink-0">
                  {i + 1}.
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Avoid */}
        <Section
          label={t("meeting_prep.specialists.section.avoid")}
          show={activation.output.avoid.length > 0}
        >
          <ul className="space-y-1">
            {activation.output.avoid.map((p, i) => (
              <li key={i} className="flex gap-2 text-muted-foreground">
                <span className="text-red-500 shrink-0">×</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Question */}
        <Section
          label={t("meeting_prep.specialists.section.question")}
          show={!!activation.output.provocativeQuestion}
        >
          <blockquote className="border-l-2 border-violet-500 pl-3 italic text-foreground/90 leading-relaxed">
            {activation.output.provocativeQuestion}
          </blockquote>
        </Section>

        {/* Anchor */}
        <Section
          label={t("meeting_prep.specialists.section.anchor")}
          show={!!activation.output.anchorPhrase}
        >
          <p
            className="rounded-md p-3 text-xs italic leading-relaxed"
            style={{ backgroundColor: `${color}10`, color: color }}
          >
            &ldquo;{activation.output.anchorPhrase}&rdquo;
          </p>
        </Section>

        {/* Streaming pulse — when nothing has streamed yet */}
        {!activation.output.situationRead &&
          (streaming || queued) && (
            <div className="space-y-2">
              <div className="h-3 rounded bg-muted animate-pulse w-3/4" />
              <div className="h-3 rounded bg-muted animate-pulse w-full" />
              <div className="h-3 rounded bg-muted animate-pulse w-2/3" />
            </div>
          )}
      </div>

      {/* Inspired details (sources + principles) — collapsible */}
      {isInspired && template && (
        <div className="border-t bg-muted/20">
          <button
            type="button"
            onClick={() => setShowSources((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <span>
              {showSources
                ? t("meeting_prep.specialists.inspired.hide_card")
                : t("meeting_prep.specialists.inspired.show_card")}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                showSources && "rotate-180",
              )}
            />
          </button>
          {showSources && (
            <div className="px-4 pb-3 space-y-2 text-xs">
              <div>
                <p className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">
                  {t("meeting_prep.specialists.inspired.sources")}
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  {template.publicSources?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">
                  {t("meeting_prep.specialists.inspired.principles")}
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  {template.thinkingPrinciples?.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="border-t p-3 flex items-center justify-between gap-2">
        <Button
          variant={activation.pinned ? "default" : "ghost"}
          size="sm"
          onClick={onTogglePin}
          disabled={!complete}
          className={cn(
            activation.pinned && "bg-violet-600 hover:bg-violet-700",
          )}
        >
          {activation.pinned ? (
            <>
              <PinOff className="h-3.5 w-3.5 mr-1.5" />
              {t("meeting_prep.specialists.action.unpin")}
            </>
          ) : (
            <>
              <Pin className="h-3.5 w-3.5 mr-1.5" />
              {t("meeting_prep.specialists.action.pin")}
            </>
          )}
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={streaming || queued}
            className="text-muted-foreground"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5 mr-1.5",
                streaming && "animate-spin",
              )}
            />
            {t("meeting_prep.specialists.action.regenerate")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </footer>
    </article>
  );
}

function Section({
  label,
  show,
  children,
}: {
  label: string;
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
