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
  name: string;
  description: string;
  icon: string;
  category: string;
  fieldCount: number;
  onUse: () => void;
  loading?: boolean;
}

export function FormTemplateCard({
  name,
  description,
  icon,
  category,
  fieldCount,
  onUse,
  loading,
}: FormTemplateCardProps) {
  const Icon = ICON_MAP[icon] || ClipboardList;

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
              {fieldCount} fields
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
        Use Template
      </Button>
    </div>
  );
}
