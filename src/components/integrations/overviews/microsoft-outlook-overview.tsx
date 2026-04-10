"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CalendarDays,
  Clock,
  Users,
  Video,
} from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface CalendarSummary {
  id: string;
  name: string;
  color: string;
  hexColor?: string;
  isDefaultCalendar: boolean;
  canEdit: boolean;
}

interface EventSummary {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  isOnlineMeeting: boolean;
  onlineMeetingProvider?: string;
  isAllDay: boolean;
  showAs: string;
  attendees?: { emailAddress: { name: string; address: string }; type: string }[];
}

// ─── Component ───────────────────────────────────────────────────

export default function MicrosoftOutlookOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [calendars, setCalendars] = useState<CalendarSummary[] | null>(null);
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    fetch("/api/integrations/microsoft-outlook/calendars")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.calendars) setCalendars(json.data.calendars);
        else setError(json.error || "Failed to load calendars");
      })
      .catch(() => setError("Network error"));

    const now = new Date().toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    fetch(
      `/api/integrations/microsoft-outlook/events?startDateTime=${encodeURIComponent(now)}&endDateTime=${encodeURIComponent(nextWeek)}&top=8`
    )
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.events) setEvents(json.data.events);
      })
      .catch(() => {});
  }, [isConnected]);

  // ─── Not Connected State ──────────────────────────────────────

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect Microsoft Outlook to see your calendars and upcoming events.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading State ────────────────────────────────────────────

  if (calendars === null && !error) {
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
            <Calendar className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-red-500 text-center">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try refreshing the page or reconnecting Microsoft Outlook.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────

  const formatEventTime = (dt: { dateTime: string }) => {
    return new Date(dt.dateTime).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const onlineMeetingCount = events?.filter((e) => e.isOnlineMeeting).length ?? 0;

  const OUTLOOK_COLORS: Record<string, string> = {
    auto: "#0078D4",
    lightBlue: "#3B82F6",
    lightGreen: "#22C55E",
    lightOrange: "#F97316",
    lightGray: "#6B7280",
    lightYellow: "#EAB308",
    lightTeal: "#14B8A6",
    lightPink: "#EC4899",
    lightBrown: "#92400E",
    lightRed: "#EF4444",
    maxColor: "#8B5CF6",
  };

  // ─── Loaded State ─────────────────────────────────────────────

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
                {calendars?.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Calendars</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-blue-500">
                {events?.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Upcoming (7d)</p>
            </div>
            <div className="rounded-lg border px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-violet-500">
                {onlineMeetingCount}
              </p>
              <p className="text-xs text-muted-foreground">Online Meetings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar List */}
      {calendars && calendars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Calendars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {calendars.map((cal) => (
                <div
                  key={cal.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        cal.hexColor || OUTLOOK_COLORS[cal.color] || "#0078D4",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cal.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {cal.canEdit ? "Read/Write" : "Read Only"}
                    </p>
                  </div>
                  {cal.isDefaultCalendar && (
                    <Badge variant="outline" className="text-[10px]">
                      Default
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {events && events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                      event.isOnlineMeeting
                        ? "bg-violet-500/10"
                        : "bg-blue-500/10"
                    }`}
                  >
                    {event.isOnlineMeeting ? (
                      <Video className="h-4 w-4 text-violet-500" />
                    ) : (
                      <CalendarDays className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {event.subject || "Untitled Event"}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatEventTime(event.start)}</span>
                      {event.attendees && event.attendees.length > 0 && (
                        <>
                          <Users className="h-3 w-3 ml-1" />
                          <span>{event.attendees.length}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {event.isOnlineMeeting && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/20"
                      >
                        {event.onlineMeetingProvider === "teamsForBusiness"
                          ? "Teams"
                          : "Online"}
                      </Badge>
                    )}
                    {event.isAllDay && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20"
                      >
                        All day
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
