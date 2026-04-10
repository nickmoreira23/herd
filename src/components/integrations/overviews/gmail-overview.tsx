"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Inbox,
  Send,
  FileEdit,
  Tag,
  MessageSquare,
} from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
}

interface LabelSummary {
  id: string;
  name: string;
  type: "system" | "user";
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: { textColor: string; backgroundColor: string };
}

interface MessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  payload?: {
    headers: { name: string; value: string }[];
  };
  internalDate: string;
  labelIds?: string[];
}

// ─── Component ───────────────────────────────────────────────────

export default function GmailOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [labels, setLabels] = useState<LabelSummary[] | null>(null);
  const [recentMessages, setRecentMessages] = useState<MessageSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    fetch("/api/integrations/gmail/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setProfile(json.data);
        else setError(json.error || "Failed to load profile");
      })
      .catch(() => setError("Network error"));

    fetch("/api/integrations/gmail/labels")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setLabels(json.data);
      })
      .catch(() => {});

    // Fetch recent inbox messages (IDs first, then details for top 5)
    fetch("/api/integrations/gmail/messages?maxResults=5&labelIds=INBOX")
      .then((r) => r.json())
      .then(async (json) => {
        if (json.data?.messages) {
          const details = await Promise.all(
            json.data.messages.slice(0, 5).map((m: { id: string }) =>
              fetch(`/api/integrations/gmail/messages/${m.id}?format=metadata`)
                .then((r) => r.json())
                .then((j) => j.data as MessageSummary)
            )
          );
          setRecentMessages(details.filter(Boolean));
        }
      })
      .catch(() => {});
  }, [isConnected]);

  // ─── Not Connected State ──────────────────────────────────────

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect Gmail to see your messages, threads, and labels.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading State ────────────────────────────────────────────

  if (profile === null && !error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-lg border px-4 py-3 text-center">
                  <Skeleton className="h-7 w-10 mx-auto mb-1" />
                  <Skeleton className="h-3 w-14 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 mb-3">
            <Mail className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-red-500 text-center">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try refreshing the page or reconnecting Gmail.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────

  const getHeader = (msg: MessageSummary, name: string) =>
    msg.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;

  const inboxLabel = labels?.find((l) => l.id === "INBOX");
  const sentLabel = labels?.find((l) => l.id === "SENT");
  const draftLabel = labels?.find((l) => l.id === "DRAFT");
  const userLabels = labels?.filter((l) => l.type === "user") ?? [];

  const formatDate = (internalDate: string) => {
    const d = new Date(parseInt(internalDate));
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // ─── Loaded State ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Profile & Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {profile && (
            <p className="text-xs text-muted-foreground mb-4">
              Connected as <span className="font-medium text-foreground">{profile.emailAddress}</span>
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <Inbox className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {inboxLabel?.messagesUnread ?? "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">Unread</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <Send className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {sentLabel?.messagesTotal ?? "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">Sent</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <FileEdit className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {draftLabel?.messagesTotal ?? "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">Drafts</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <MessageSquare className="h-4 w-4 text-violet-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {profile?.threadsTotal?.toLocaleString() ?? "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">Threads</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      {recentMessages && recentMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Inbox</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getHeader(msg, "subject") || "(No subject)"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {getHeader(msg, "from") || "Unknown sender"}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDate(msg.internalDate)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Labels */}
      {userLabels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userLabels.map((label) => (
                <Badge
                  key={label.id}
                  variant="outline"
                  className="text-xs"
                  style={
                    label.color
                      ? {
                          backgroundColor: label.color.backgroundColor + "20",
                          color: label.color.textColor,
                          borderColor: label.color.backgroundColor + "40",
                        }
                      : undefined
                  }
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {label.name}
                  {label.messagesUnread != null && label.messagesUnread > 0 && (
                    <span className="ml-1 text-[10px]">({label.messagesUnread})</span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
