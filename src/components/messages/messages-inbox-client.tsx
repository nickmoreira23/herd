"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ThreadRow } from "./types";
import { getThreadColumns } from "./thread-columns";
import { BlockListPage } from "@/components/shared/block-list-page";
import type {
  FilterDef,
  StatCard,
  BulkActionDef,
} from "@/components/shared/block-list-page/types";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MessageSquare,
  Archive,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface MessagesInboxClientProps {
  initialThreads: ThreadRow[];
  stats: StatCard[];
}

export function MessagesInboxClient({
  initialThreads,
  stats,
}: MessagesInboxClientProps) {
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadRow[]>(initialThreads);

  const refreshThreads = useCallback(async () => {
    const res = await fetch("/api/messages/threads");
    const json = await res.json();
    if (json.data) setThreads(json.data);
  }, []);

  const columns = useMemo(
    () => getThreadColumns(),
    []
  );

  // ── Filters ───────────────────────────────────────────────────────

  const filters: FilterDef<ThreadRow>[] = [
    {
      key: "channelType",
      label: "All Channels",
      options: [
        { value: "INTERNAL", label: "Internal" },
        { value: "EMAIL", label: "Email" },
        { value: "SMS", label: "SMS" },
        { value: "WHATSAPP", label: "WhatsApp" },
        { value: "INSTAGRAM", label: "Instagram" },
        { value: "FACEBOOK", label: "Facebook" },
        { value: "SLACK", label: "Slack" },
        { value: "INTERCOM", label: "Intercom" },
      ],
      filterFn: (item, value) => item.channel.channelType === value,
    },
    {
      key: "status",
      label: "All Statuses",
      options: [
        { value: "OPEN", label: "Open" },
        { value: "CLOSED", label: "Closed" },
        { value: "ARCHIVED", label: "Archived" },
        { value: "SNOOZED", label: "Snoozed" },
      ],
      filterFn: (item, value) => item.status === value,
    },
  ];

  // ── Bulk actions ──────────────────────────────────────────────────

  const bulkActions: BulkActionDef[] = [
    {
      key: "close",
      label: "Close",
      icon: CheckCircle2,
      handler: async (ids) => {
        await Promise.all(
          ids.map((id) =>
            fetch(`/api/messages/threads/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "CLOSED" }),
            })
          )
        );
        await refreshThreads();
        toast.success(`Closed ${ids.length} thread${ids.length === 1 ? "" : "s"}`);
      },
    },
    {
      key: "archive",
      label: "Archive",
      icon: Archive,
      handler: async (ids) => {
        await Promise.all(
          ids.map((id) =>
            fetch(`/api/messages/threads/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "ARCHIVED" }),
            })
          )
        );
        await refreshThreads();
        toast.success(`Archived ${ids.length} thread${ids.length === 1 ? "" : "s"}`);
      },
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      variant: "destructive",
      handler: async (ids) => {
        if (
          !confirm(
            `Delete ${ids.length} thread${ids.length === 1 ? "" : "s"}? This cannot be undone.`
          )
        )
          return;
        await Promise.all(
          ids.map((id) =>
            fetch(`/api/messages/threads/${id}`, { method: "DELETE" })
          )
        );
        setThreads((prev) => prev.filter((t) => !ids.includes(t.id)));
        toast.success(`Deleted ${ids.length} thread${ids.length === 1 ? "" : "s"}`);
      },
    },
  ];

  // ── Header actions ────────────────────────────────────────────────

  const headerActions = (
    <Button size="sm" onClick={() => toast.info("Create thread coming soon")}>
      <Plus className="mr-1 h-3 w-3" />
      New Thread
    </Button>
  );

  // ── Render ────────────────────────────────────────────────────────

  return (
    <BlockListPage<ThreadRow>
      blockName="messages"
      title="Messages"
      description="Centralized inbox for all conversations across channels."
      data={threads}
      getId={(t) => t.id}
      columns={columns as never}
      enableRowSelection
      onRowClick={(t) => router.push(`/admin/blocks/messages/${t.id}`)}
      searchPlaceholder="Search threads..."
      searchFn={(t, q) =>
        (t.subject ? t.subject.toLowerCase().includes(q) : false) ||
        (t.contact
          ? `${t.contact.firstName} ${t.contact.lastName}`
              .toLowerCase()
              .includes(q)
          : false) ||
        (t.messages[0]
          ? t.messages[0].content.toLowerCase().includes(q)
          : false)
      }
      filters={filters}
      stats={stats}
      headerActions={headerActions}
      bulkActions={bulkActions}
      emptyIcon={MessageSquare}
      emptyTitle="No messages yet"
      emptyDescription="Messages from connected channels will appear here."
    />
  );
}
