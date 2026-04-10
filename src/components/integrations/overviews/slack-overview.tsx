"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Hash,
  Users,
  MessageSquare,
  Lock,
  Globe,
} from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface SlackTeam {
  id: string;
  name: string;
  domain: string;
  icon?: { image_68?: string; image_132?: string };
}

interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_general: boolean;
  is_member: boolean;
  num_members: number;
  topic?: { value: string };
  purpose?: { value: string };
}

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    display_name: string;
    image_48: string;
    title?: string;
    status_text?: string;
    status_emoji?: string;
  };
  is_admin: boolean;
  is_owner: boolean;
}

// ─── Component ───────────────────────────────────────────────────

export default function SlackOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [team, setTeam] = useState<SlackTeam | null>(null);
  const [channels, setChannels] = useState<SlackChannel[] | null>(null);
  const [users, setUsers] = useState<SlackUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    fetch("/api/integrations/slack/team")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.team) setTeam(json.data.team);
        else setError(json.error || "Failed to load team");
      })
      .catch(() => setError("Network error"));

    fetch("/api/integrations/slack/channels?limit=50")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.channels) setChannels(json.data.channels);
      })
      .catch(() => {});

    fetch("/api/integrations/slack/users?limit=50")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.users) setUsers(json.data.users);
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
            Connect Slack to see your workspace channels, members, and messages.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading State ────────────────────────────────────────────

  if (team === null && !error) {
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
            Try refreshing the page or reconnecting Slack.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Derived Data ─────────────────────────────────────────────

  const publicChannels = channels?.filter((c) => !c.is_private) ?? [];
  const privateChannels = channels?.filter((c) => c.is_private) ?? [];
  const memberChannels = channels?.filter((c) => c.is_member) ?? [];
  const admins = users?.filter((u) => u.is_admin || u.is_owner) ?? [];

  // ─── Loaded State ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Workspace Info */}
      {team && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              {team.icon?.image_68 && (
                <img
                  src={team.icon.image_68}
                  alt={team.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium">{team.name}</p>
                <p className="text-xs text-muted-foreground">
                  {team.domain}.slack.com
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border px-4 py-3 text-center">
                <p className="text-2xl font-bold tabular-nums text-emerald-500">
                  {channels?.length ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Channels</p>
              </div>
              <div className="rounded-lg border px-4 py-3 text-center">
                <p className="text-2xl font-bold tabular-nums text-blue-500">
                  {memberChannels.length}
                </p>
                <p className="text-xs text-muted-foreground">Joined</p>
              </div>
              <div className="rounded-lg border px-4 py-3 text-center">
                <p className="text-2xl font-bold tabular-nums text-violet-500">
                  {users?.length ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
              <div className="rounded-lg border px-4 py-3 text-center">
                <p className="text-2xl font-bold tabular-nums text-amber-500">
                  {admins.length}
                </p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channels */}
      {channels && channels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Channels
              <span className="text-muted-foreground font-normal ml-1.5">
                ({channels.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {channels.slice(0, 10).map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                      channel.is_private
                        ? "bg-amber-500/10"
                        : "bg-emerald-500/10"
                    }`}
                  >
                    {channel.is_private ? (
                      <Lock className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Hash className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {channel.name}
                      </p>
                      {channel.is_general && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20"
                        >
                          General
                        </Badge>
                      )}
                    </div>
                    {channel.purpose?.value && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {channel.purpose.value}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {channel.num_members}
                    </span>
                  </div>
                  {channel.is_member && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    >
                      Joined
                    </Badge>
                  )}
                </div>
              ))}
              {channels.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  + {channels.length - 10} more channels
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      {users && users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Members
              <span className="text-muted-foreground font-normal ml-1.5">
                ({users.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.slice(0, 8).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <img
                    src={user.profile.image_48}
                    alt={user.real_name}
                    className="h-9 w-9 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {user.real_name || user.profile.display_name}
                      </p>
                      {user.profile.status_emoji && (
                        <span className="text-xs">
                          {user.profile.status_emoji}
                        </span>
                      )}
                    </div>
                    {user.profile.title && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {user.profile.title}
                      </p>
                    )}
                  </div>
                  {(user.is_owner || user.is_admin) && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        user.is_owner
                          ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
                          : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      }`}
                    >
                      {user.is_owner ? "Owner" : "Admin"}
                    </Badge>
                  )}
                </div>
              ))}
              {users.length > 8 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  + {users.length - 8} more members
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {channels && channels.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Globe className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No channels found in this workspace.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
