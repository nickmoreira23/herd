"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Trash2,
  Loader2,
  Video,
  Mic,
  Sparkles,
} from "lucide-react";
import type { MeetingRow } from "./types";

interface ColumnActions {
  onView: (meeting: MeetingRow) => void;
  onDelete: (meeting: MeetingRow) => void;
  onSummarize: (meeting: MeetingRow) => void;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs >= 1) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; spinning?: boolean }
> = {
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  RECORDING: {
    label: "Recording",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
    spinning: true,
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    spinning: true,
  },
  READY: {
    label: "Ready",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  ERROR: {
    label: "Error",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

const PLATFORM_CONFIG: Record<string, { label: string; icon: typeof Video }> = {
  GOOGLE_MEET: { label: "Google Meet", icon: Video },
  ZOOM: { label: "Zoom", icon: Video },
  MICROSOFT_TEAMS: { label: "Teams", icon: Video },
  OTHER: { label: "Other", icon: Video },
};

export function getMeetingColumns(actions: ColumnActions): ColumnDef<MeetingRow>[] {
  return [
    {
      accessorKey: "title",
      header: () => <span className="text-xs font-medium">Title</span>,
      cell: ({ row }) => {
        const meeting = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{meeting.title}</span>
            {meeting.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {meeting.description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "platform",
      header: () => <span className="text-xs">Platform</span>,
      cell: ({ row }) => {
        const meeting = row.original;
        // In-person meetings don't have a platform
        if (meeting.meetingType === "IN_PERSON") {
          return (
            <div className="flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">In-Person</span>
            </div>
          );
        }
        const config = PLATFORM_CONFIG[meeting.platform] || PLATFORM_CONFIG.OTHER;
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{config.label}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "duration",
      header: () => <span className="text-xs font-medium">Duration</span>,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.original.duration != null
            ? formatDuration(row.original.duration)
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "participantCount",
      header: () => <span className="text-xs">Participants</span>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.participantCount ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs">Status</span>,
      cell: ({ row }) => {
        const status = row.original.status;
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED;
        return (
          <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
            {config.spinning && (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            )}
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: () => <span className="text-xs font-medium">Date</span>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue("createdAt") as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const meeting = row.original;
        const canSummarize =
          meeting.status === "READY" && meeting.transcript && !meeting.summary;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(meeting)}>
                <Eye className="mr-2 h-3.5 w-3.5" />
                View
              </DropdownMenuItem>
              {canSummarize && (
                <DropdownMenuItem onClick={() => actions.onSummarize(meeting)}>
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Generate Summary
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => actions.onDelete(meeting)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
