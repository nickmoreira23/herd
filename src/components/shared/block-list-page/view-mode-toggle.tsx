"use client";

import { List, LayoutGrid, Calendar, Kanban } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEW_ICONS: Record<string, LucideIcon> = {
  list: List,
  card: LayoutGrid,
  calendar: Calendar,
  kanban: Kanban,
};

const VIEW_LABELS: Record<string, string> = {
  list: "List",
  card: "Card",
  calendar: "Calendar",
  kanban: "Kanban",
};

interface ViewModeToggleProps {
  views: string[];
  active: string;
  onChange: (view: string) => void;
}

export function ViewModeToggle({
  views,
  active,
  onChange,
}: ViewModeToggleProps) {
  if (views.length <= 1) return null;

  return (
    <div className="flex items-center rounded-lg bg-muted p-1 shrink-0">
      {views.map((view) => {
        const Icon = VIEW_ICONS[view];
        const label = VIEW_LABELS[view] ?? view;
        return (
          <button
            key={view}
            onClick={() => onChange(view)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              active === view
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title={label}
          >
            {Icon && <Icon className="h-4 w-4" />}
          </button>
        );
      })}
    </div>
  );
}
