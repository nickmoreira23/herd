"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Users,
  UserCog,
  UsersRound,
  Tag,
  BookOpen,
  Filter,
} from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface ConversationSummary {
  id: string;
  title: string | null;
  state: string;
  open: boolean;
  priority: string;
  created_at: number;
  updated_at: number;
  source: {
    subject: string | null;
    author: { name: string | null; email: string | null };
  };
}

interface IntercomCounts {
  conversation: {
    open: number;
    closed: number;
    unassigned: number;
    assigned: number;
  };
  user: { count: number };
  lead: { count: number };
  tag: { count: number };
  segment: { count: number };
}

interface Admin {
  id: string;
  name: string;
  email: string;
  away_mode_enabled: boolean;
}

interface Team {
  id: string;
  name: string;
  admin_ids: number[];
}

// ─── Component ───────────────────────────────────────────────────

export default function IntercomOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [counts, setCounts] = useState<IntercomCounts | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    fetch("/api/integrations/intercom/statistics")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setCounts(json.data);
        else setError(json.error || "Failed to load statistics");
      })
      .catch(() => setError("Network error"));

    fetch("/api/integrations/intercom/conversations?per_page=5")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.conversations) setConversations(json.data.conversations);
      })
      .catch(() => {});

    fetch("/api/integrations/intercom/admins")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setAdmins(json.data);
      })
      .catch(() => {});

    fetch("/api/integrations/intercom/teams")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setTeams(json.data);
      })
      .catch(() => {});
  }, [isConnected]);

  // ─── Not Connected State ──────────────────────────────────────

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect Intercom to see your conversations, contacts, and teams.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading State ────────────────────────────────────────────

  if (counts === null && !error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
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
            <MessageSquare className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-red-500 text-center">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try refreshing the page or reconnecting Intercom.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loaded State ─────────────────────────────────────────────

  const stateColor = (state: string) => {
    if (state === "open") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (state === "closed") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (state === "snoozed") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    return "bg-muted/50 text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-amber-500">
                {counts?.conversation.open ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">
                {(counts?.user.count ?? 0) + (counts?.lead.count ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">Contacts</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">
                {admins?.length ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">
                {teams?.length ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Teams</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Conversation Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <MessageSquare className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {counts?.conversation.unassigned ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Unassigned</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <UserCog className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {counts?.conversation.assigned ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Assigned</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <Tag className="h-4 w-4 text-violet-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {counts?.tag.count ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Tags</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <Filter className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {counts?.segment.count ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Segments</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Conversations */}
      {conversations && conversations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conv.source?.subject || conv.title || `Conversation #${conv.id}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {conv.source?.author?.name || conv.source?.author?.email || "Unknown"}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${stateColor(conv.state)}`}>
                    {conv.state}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams & Admins */}
      {((teams && teams.length > 0) || (admins && admins.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams && teams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <UsersRound className="h-4 w-4 text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{team.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {team.admin_ids.length} {team.admin_ids.length === 1 ? "member" : "members"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {admins && admins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {admins.slice(0, 8).map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <Users className="h-4 w-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{admin.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {admin.email}
                        </p>
                      </div>
                      {admin.away_mode_enabled && (
                        <Badge variant="outline" className="text-[10px] bg-muted/50">
                          Away
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
