"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  Clock,
  Users,
  Bot,
  CalendarDays,
  RefreshCw,
  Plug,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { ConnectCalendarDialog } from "./connect-calendar-dialog";

// ─── Types ───────────────────────────────────────────────────────

interface UpcomingEvent {
  externalId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  meetingUrl: string | null;
  platform: "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS" | "OTHER";
  attendees: Array<{ name: string; email: string }>;
  isOnlineMeeting: boolean;
  sourceIntegration: string;
  meetingRecordId: string | null;
  botStatus: string | null;
  recordingStatus: string | null;
}

interface ConnectedProvider {
  slug: string;
  name: string;
  integrationId: string;
}

interface UpcomingData {
  events: UpcomingEvent[];
  connectedProviders: ConnectedProvider[];
  totalEvents: number;
  onlineMeetings: number;
}

// ─── Platform Config ────────────────────────────────────────────

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  GOOGLE_MEET: { label: "Google Meet", color: "text-green-600", bgColor: "bg-green-500/10" },
  ZOOM: { label: "Zoom", color: "text-blue-600", bgColor: "bg-blue-500/10" },
  MICROSOFT_TEAMS: { label: "Teams", color: "text-violet-600", bgColor: "bg-violet-500/10" },
  OTHER: { label: "Other", color: "text-gray-600", bgColor: "bg-gray-500/10" },
};

const PROVIDER_COLORS: Record<string, string> = {
  "google-calendar": "bg-blue-500",
  "microsoft-outlook": "bg-sky-500",
  zoom: "bg-blue-600",
};

// ─── Component ──────────────────────────────────────────────────

export function UpcomingMeetings() {
  const [data, setData] = useState<UpcomingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/meetings/upcoming?hours=48");
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch {
      // Silently fail — the table below still works
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchData(), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Loading State ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasProviders = data && data.connectedProviders.length > 0;
  const events = data?.events || [];
  const onlineMeetings = events.filter((e) => e.isOnlineMeeting);

  // ─── No Providers Connected ───────────────────────────────────

  if (!hasProviders) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <Plug className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No calendars connected</p>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            Connect Google Calendar, Microsoft Outlook, or Zoom to see your upcoming
            meetings and enable automatic recording.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setCalendarDialogOpen(true)}
          >
            Connect Calendar
          </Button>
          <ConnectCalendarDialog
            open={calendarDialogOpen}
            onOpenChange={setCalendarDialogOpen}
            onConnected={() => fetchData(true)}
          />
        </CardContent>
      </Card>
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const time = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    if (isToday) return `Today, ${time}`;
    if (isTomorrow) return `Tomorrow, ${time}`;
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTimeUntil = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff < 0) return "Started";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h ${mins % 60}m`;
    return `in ${Math.floor(hrs / 24)}d`;
  };

  // ─── Connected Providers Bar ──────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Provider Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data.connectedProviders.map((p) => (
            <div
              key={p.slug}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1"
            >
              <div
                className={`h-2 w-2 rounded-full ${PROVIDER_COLORS[p.slug] || "bg-gray-400"}`}
              />
              <span className="text-[11px] font-medium">{p.name}</span>
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="h-7 text-xs"
        >
          {refreshing ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          Refresh
        </Button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border px-3 py-2.5 text-center">
          <p className="text-xl font-bold tabular-nums">{events.length}</p>
          <p className="text-[10px] text-muted-foreground">Events (48h)</p>
        </div>
        <div className="rounded-lg border px-3 py-2.5 text-center">
          <p className="text-xl font-bold tabular-nums text-blue-500">
            {onlineMeetings.length}
          </p>
          <p className="text-[10px] text-muted-foreground">Online Meetings</p>
        </div>
        <div className="rounded-lg border px-3 py-2.5 text-center">
          <p className="text-xl font-bold tabular-nums text-violet-500">
            {events.filter((e) => e.botStatus === "deployed").length}
          </p>
          <p className="text-[10px] text-muted-foreground">Bots Deployed</p>
        </div>
        <div className="rounded-lg border px-3 py-2.5 text-center">
          <p className="text-xl font-bold tabular-nums text-emerald-500">
            {data.connectedProviders.length}
          </p>
          <p className="text-[10px] text-muted-foreground">Calendars</p>
        </div>
      </div>

      {/* Upcoming Events List */}
      {onlineMeetings.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Upcoming Online Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {onlineMeetings.slice(0, 10).map((event) => {
                const platform = PLATFORM_CONFIG[event.platform] || PLATFORM_CONFIG.OTHER;
                return (
                  <div
                    key={`${event.sourceIntegration}-${event.externalId}`}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                  >
                    {/* Platform Icon */}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${platform.bgColor}`}
                    >
                      <Video className={`h-4.5 w-4.5 ${platform.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{formatTime(event.startTime)}</span>
                        {event.attendees.length > 0 && (
                          <>
                            <Users className="h-3 w-3 ml-1 shrink-0" />
                            <span>{event.attendees.length}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {event.botStatus === "deployed" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/20"
                        >
                          <Bot className="h-3 w-3 mr-0.5" />
                          Bot
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${platform.bgColor} ${platform.color}`}
                      >
                        {platform.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                        {getTimeUntil(event.startTime)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CalendarDays className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No upcoming online meetings in the next 48 hours.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Non-online events hint */}
      {events.length > onlineMeetings.length && (
        <p className="text-[11px] text-muted-foreground text-center">
          + {events.length - onlineMeetings.length} non-meeting event(s) not shown
        </p>
      )}
    </div>
  );
}
