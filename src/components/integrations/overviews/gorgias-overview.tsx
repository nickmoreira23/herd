"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ticket,
  Users,
  UsersRound,
  Mail,
  MessageCircle,
  Phone,
  Globe,
  Tag,
  Eye,
  Zap,
  Bot,
} from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface TicketSummary {
  id: number;
  subject: string | null;
  status: string;
  channel: string;
  priority: string;
  customer: { name: string; email: string } | null;
  created_datetime: string;
  updated_datetime: string;
}

interface ChannelSummary {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
}

interface TeamSummary {
  id: number;
  name: string;
  member_count: number;
}

// ─── Component ───────────────────────────────────────────────────

export default function GorgiasOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);
  const [channels, setChannels] = useState<ChannelSummary[] | null>(null);
  const [teams, setTeams] = useState<TeamSummary[] | null>(null);
  const [tags, setTags] = useState<{ id: number; name: string }[] | null>(null);
  const [views, setViews] = useState<{ id: number; name: string }[] | null>(null);
  const [macros, setMacros] = useState<{ id: number; name: string }[] | null>(null);
  const [rules, setRules] = useState<{ id: number; name: string; enabled: boolean }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    fetch("/api/integrations/gorgias/tickets?limit=5")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.tickets) setTickets(json.data.tickets);
        else if (json.error) setError(json.error);
      })
      .catch(() => setError("Network error"));

    fetch("/api/integrations/gorgias/channels")
      .then((r) => r.json())
      .then((json) => { if (json.data) setChannels(json.data); })
      .catch(() => {});

    fetch("/api/integrations/gorgias/teams")
      .then((r) => r.json())
      .then((json) => { if (json.data) setTeams(json.data); })
      .catch(() => {});

    fetch("/api/integrations/gorgias/tags")
      .then((r) => r.json())
      .then((json) => { if (json.data) setTags(json.data); })
      .catch(() => {});

    fetch("/api/integrations/gorgias/views")
      .then((r) => r.json())
      .then((json) => { if (json.data) setViews(json.data); })
      .catch(() => {});

    fetch("/api/integrations/gorgias/macros")
      .then((r) => r.json())
      .then((json) => { if (json.data) setMacros(json.data); })
      .catch(() => {});

    fetch("/api/integrations/gorgias/rules")
      .then((r) => r.json())
      .then((json) => { if (json.data) setRules(json.data); })
      .catch(() => {});
  }, [isConnected]);

  // ─── Not Connected State ──────────────────────────────────────

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <Ticket className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect Gorgias to see your tickets, channels, and customer support data.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading State ────────────────────────────────────────────

  if (tickets === null && !error) {
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
            <Ticket className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-red-500 text-center">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try refreshing the page or reconnecting Gorgias.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loaded State ─────────────────────────────────────────────

  const statusColor = (status: string) => {
    if (status === "open") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (status === "closed") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (status === "pending") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    return "bg-muted/50 text-muted-foreground";
  };

  const channelIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-3.5 w-3.5" />;
      case "chat": case "live-chat": return <MessageCircle className="h-3.5 w-3.5" />;
      case "phone": case "voice": return <Phone className="h-3.5 w-3.5" />;
      default: return <Globe className="h-3.5 w-3.5" />;
    }
  };

  const activeChannels = channels?.filter((c) => c.is_active).length ?? 0;
  const enabledRules = rules?.filter((r) => r.enabled).length ?? 0;

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
              <p className="text-2xl font-bold tabular-nums">
                {channels?.length ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Channels</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">
                {teams?.length ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Teams</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">
                {tags?.length ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Tags</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">
                {views?.length ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Automation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <Bot className="h-4 w-4 text-violet-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {macros?.length ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Macros</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {enabledRules}/{rules?.length ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Active Rules</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
              <Eye className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {activeChannels}/{channels?.length ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Active Channels</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      {tickets && tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 shrink-0">
                    <Ticket className="h-4 w-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {ticket.subject || `Ticket #${ticket.id}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {ticket.customer?.name || ticket.customer?.email || "Unknown customer"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${statusColor(ticket.status)}`}>
                      {ticket.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channels & Teams */}
      {((channels && channels.length > 0) || (teams && teams.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {channels && channels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="text-muted-foreground shrink-0">
                        {channelIcon(channel.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{channel.name}</p>
                        <p className="text-[10px] text-muted-foreground">{channel.type}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${channel.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted/50 text-muted-foreground"}`}
                      >
                        {channel.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                          {team.member_count} {team.member_count === 1 ? "member" : "members"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-[10px] bg-violet-500/5 text-violet-500 border-violet-500/20"
                >
                  <Tag className="h-2.5 w-2.5 mr-1" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
