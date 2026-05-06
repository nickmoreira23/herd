"use client";

import {
  ChevronsUpDown,
  Check,
  User,
  Building2,
  Crown,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useProfileView } from "@/lib/core/profile-view/hook";
import {
  PROFILE_VIEWS,
  PROFILE_VIEW_LABELS,
  type ProfileView,
} from "@/lib/core/profile-view/types";

const PROFILE_VIEW_ICONS: Record<ProfileView, LucideIcon> = {
  member: User,
  reseller: Handshake,
  organization: Building2,
  orchestrator: Crown,
};

export function ProfileViewSelector() {
  const { view, setView } = useProfileView();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors truncate -ml-0.5 px-0.5 rounded",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
      >
        <span className="truncate">{PROFILE_VIEW_LABELS[view]}</span>
        <ChevronsUpDown className="h-3 w-3 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {PROFILE_VIEWS.map((v) => {
          const Icon = PROFILE_VIEW_ICONS[v];
          const isActive = view === v;
          return (
            <DropdownMenuItem
              key={v}
              onClick={() => setView(v)}
              className="flex items-center gap-2 py-2"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium flex-1">{PROFILE_VIEW_LABELS[v]}</span>
              <Check className={cn("h-4 w-4 shrink-0", isActive ? "opacity-100" : "opacity-0")} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
