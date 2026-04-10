"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, MapPin, Users, ExternalLink } from "lucide-react";
import type { CalendarEventRow } from "./types";

interface ColumnActions {
  onView: (event: CalendarEventRow) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  TENTATIVE: {
    label: "Tentative",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

function formatEventTime(startAt: string, endAt: string, isAllDay: boolean): string {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (isAllDay) {
    return start.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const sameDay = start.toDateString() === end.toDateString();
  const dateStr = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (sameDay) {
    return `${dateStr}, ${startTime} – ${endTime}`;
  }
  return `${dateStr}, ${startTime} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${endTime}`;
}

export function getEventColumns(actions: ColumnActions): ColumnDef<CalendarEventRow>[] {
  return [
    {
      accessorKey: "title",
      header: () => <span className="text-xs font-medium">Event</span>,
      cell: ({ row }) => {
        const event = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{event.title}</span>
            {event.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {event.description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "startAt",
      header: () => <span className="text-xs font-medium">Date & Time</span>,
      cell: ({ row }) => {
        const event = row.original;
        return (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatEventTime(event.startAt, event.endAt, event.isAllDay)}
          </span>
        );
      },
    },
    {
      accessorKey: "calendarSync",
      header: () => <span className="text-xs font-medium">Calendar</span>,
      cell: ({ row }) => {
        const sync = row.original.calendarSync;
        return (
          <div className="flex items-center gap-2">
            {sync.calendarColor && (
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: sync.calendarColor }}
              />
            )}
            <span className="text-sm text-muted-foreground truncate max-w-[140px]">
              {sync.calendarName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "attendees",
      header: () => <span className="text-xs font-medium">Attendees</span>,
      cell: ({ row }) => {
        const count = row.original.attendees.length;
        if (count === 0) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {count}
          </span>
        );
      },
    },
    {
      accessorKey: "location",
      header: () => <span className="text-xs font-medium">Location</span>,
      cell: ({ row }) => {
        const loc = row.original.location;
        if (!loc) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <span className="flex items-center gap-1 text-sm text-muted-foreground truncate max-w-[160px]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {loc}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs font-medium">Status</span>,
      cell: ({ row }) => {
        const status = row.original.status;
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.CONFIRMED;
        return (
          <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const event = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(event)}>
                <Eye className="mr-2 h-3.5 w-3.5" />
                View Details
              </DropdownMenuItem>
              {event.htmlLink && (
                <DropdownMenuItem
                  onClick={() => window.open(event.htmlLink!, "_blank")}
                >
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  Open in Calendar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
