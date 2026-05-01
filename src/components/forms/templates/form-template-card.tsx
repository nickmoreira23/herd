"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MessageSquare,
  Handshake,
  Package,
  Calendar,
  TrendingUp,
  LifeBuoy,
  BookOpen,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { pluralize } from "@/lib/i18n/pluralize";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import { messages as PT_BR_MESSAGES } from "@/lib/i18n/messages/pt-BR";

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  MessageSquare,
  Handshake,
  Package,
  Calendar,
  TrendingUp,
  LifeBuoy,
  BookOpen,
};

interface FormTemplateCardProps {
  templateKey: string;
  fallbackName: string;
  fallbackDescription: string;
  fallbackCategory: string;
  icon: string;
  fieldCount: number;
  onUse: () => void;
  loading?: boolean;
}

/** Defensive lookup: returns translated value if key exists in dictionary, else fallback. */
function lookupOrFallback(
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
  candidate: string,
  fallback: string,
): string {
  if (Object.prototype.hasOwnProperty.call(PT_BR_MESSAGES, candidate)) {
    return t(candidate as MessageKey);
  }
  return fallback;
}

export function FormTemplateCard({
  templateKey,
  fallbackName,
  fallbackDescription,
  fallbackCategory,
  icon,
  fieldCount,
  onUse,
  loading,
}: FormTemplateCardProps) {
  const t = useT();
  const locale = useLocale();
  const Icon = ICON_MAP[icon] || ClipboardList;

  const name = lookupOrFallback(
    t,
    `forms.templates.${templateKey}.name`,
    fallbackName,
  );
  const description = lookupOrFallback(
    t,
    `forms.templates.${templateKey}.description`,
    fallbackDescription,
  );
  const category = lookupOrFallback(
    t,
    `forms.templates.category.${fallbackCategory}`,
    fallbackCategory,
  );

  const fieldCountLabel = pluralize(fieldCount, locale, {
    one: t("forms.templates.field_count_one", { count: fieldCount }),
    other: t("forms.templates.field_count_other", { count: fieldCount }),
  });

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col hover:border-foreground/20 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-violet-500/10 shrink-0">
          <Icon className="h-4 w-4 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-[10px]">
              {category}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {fieldCountLabel}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground flex-1 mb-3 line-clamp-2">
        {description}
      </p>

      <Button
        variant="outline"
        size="sm"
        onClick={onUse}
        disabled={loading}
        className="w-full"
      >
        {t("forms.templates.use_template")}
      </Button>
    </div>
  );
}
