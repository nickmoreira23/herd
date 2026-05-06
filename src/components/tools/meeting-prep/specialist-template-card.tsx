"use client";

import { Check, Info } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { TOOL_ICON_MAP } from "@/lib/tools/category-meta";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SpecialistTemplate } from "@/lib/meeting-prep/types";

interface SpecialistTemplateCardProps {
  template: SpecialistTemplate;
  selected: boolean;
  /** True when the cap (5) is reached and this card is NOT already selected. */
  disabled: boolean;
  onToggle: () => void;
}

export function SpecialistTemplateCard({
  template,
  selected,
  disabled,
  onToggle,
}: SpecialistTemplateCardProps) {
  const t = useT();
  const Icon = TOOL_ICON_MAP[template.icon] ?? Wrench;
  const isInspired = template.kind === "inspired";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 flex flex-col gap-3 transition-colors",
        selected && "border-violet-500 ring-1 ring-violet-500/40",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="rounded-lg p-2.5 shrink-0"
          style={{ backgroundColor: `${template.color}15` }}
        >
          <Icon className="h-5 w-5" style={{ color: template.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-sm leading-tight">
              {isInspired
                ? t("meeting_prep.specialists.inspired.style_prefix", {
                    name: template.name,
                  })
                : template.name}
            </h3>
            {isInspired && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {t("meeting_prep.specialists.inspired.disclaimer", {
                    name: template.name,
                  })}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {template.lens}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {template.shortDescription}
      </p>

      {isInspired && (
        <div className="rounded-md bg-muted/40 border border-border/40 p-2 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("meeting_prep.specialists.inspired.sources")}
          </p>
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
            {template.publicSources?.join(" · ")}
          </p>
        </div>
      )}

      <Button
        variant={selected ? "default" : "outline"}
        size="sm"
        onClick={onToggle}
        className={cn(
          "w-full",
          selected && "bg-violet-600 hover:bg-violet-700",
        )}
      >
        {selected ? (
          <>
            <Check className="h-3.5 w-3.5 mr-1.5" />
            {t("meeting_prep.specialists.remove_from_panel")}
          </>
        ) : (
          t("meeting_prep.specialists.add_to_panel")
        )}
      </Button>
    </div>
  );
}
