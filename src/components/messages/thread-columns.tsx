"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { ThreadRow } from "./types";
import { ChannelBadge } from "./channel-badge";
import { formatDistanceToNow } from "date-fns";

const col = createColumnHelper<ThreadRow>();

const STATUS_COLORS: Record<string, string> = {
  OPEN: "text-emerald-600 bg-emerald-50",
  CLOSED: "text-muted-foreground bg-muted",
  ARCHIVED: "text-muted-foreground bg-muted",
  SNOOZED: "text-amber-600 bg-amber-50",
};

const PRIORITY_LABELS: Record<number, { label: string; className: string }> = {
  0: { label: "", className: "" },
  1: { label: "High", className: "text-amber-600" },
  2: { label: "Urgent", className: "text-red-600" },
};

export function getThreadColumns() {
  return [
    col.accessor("contact", {
      header: "Contact",
      cell: ({ getValue }) => {
        const contact = getValue();
        if (!contact) return <span className="text-muted-foreground text-xs">Unknown</span>;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="text-[10px] font-medium text-muted-foreground">
                {contact.firstName[0]}
                {contact.lastName[0]}
              </span>
            </div>
            <span className="truncate text-sm font-medium">
              {contact.firstName} {contact.lastName}
            </span>
          </div>
        );
      },
    }),
    col.accessor("channel", {
      header: "Channel",
      cell: ({ getValue }) => {
        const channel = getValue();
        return <ChannelBadge channelType={channel.channelType} />;
      },
    }),
    col.accessor("subject", {
      header: "Subject",
      cell: ({ row }) => {
        const subject = row.original.subject;
        const lastMessage = row.original.messages[0];
        return (
          <div className="min-w-0">
            {subject && (
              <p className="text-sm font-medium truncate">{subject}</p>
            )}
            {lastMessage && (
              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                {lastMessage.content.slice(0, 100)}
              </p>
            )}
          </div>
        );
      },
    }),
    col.accessor("status", {
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue();
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[status] || ""}`}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
        );
      },
    }),
    col.accessor("priority", {
      header: "Priority",
      cell: ({ getValue }) => {
        const p = PRIORITY_LABELS[getValue()];
        if (!p?.label) return null;
        return (
          <span className={`text-xs font-medium ${p.className}`}>
            {p.label}
          </span>
        );
      },
    }),
    col.accessor("_count", {
      header: "Messages",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {getValue().messages}
        </span>
      ),
    }),
    col.accessor("lastMessageAt", {
      header: "Last Activity",
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(v), { addSuffix: true })}
          </span>
        );
      },
    }),
  ];
}
