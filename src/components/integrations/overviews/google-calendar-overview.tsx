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
} from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface CalendarSummary {
  id: string;
  summary: string;
  backgroundColor?: string;
  primary?: boolean;
  accessRole: string;
}

interface EventSummary {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status: string;
  attendees?: { email: string; displayName?: string; responseStatus: string }[];
  htmlLink?: string;
}

// ─── Component ───────────────────────────────────────────────────

export default function GoogleCalendarOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [calendars, setCalendars] = useState<CalendarSummary[] | null>(null);
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    fetch("/api/integrations/google-calendar/calendars")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setCalendars(json.data);
        else setError(json.error || "Failed to load calendars");
      })
      .catch(() => setError("Network error"));

    const now = new Date().toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    fetch(
      `/api/integrations/google-calendar/events?calendarId=primary&timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(nextWeek)}&maxResults=5&singleEvents=true&orderBy=startTime`
    )
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.items) setEvents(json.data.items);
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
            Connect Google Calendar to see your calendars and upcoming events.
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
              {[...Array(2)].map((_, i) => (
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
            Try refreshing the page or reconnecting Google Calendar.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────

  const formatEventTime = (dt: { dateTime?: string; date?: string }) => {
    if (dt.dateTime) {
      return new Date(dt.dateTime).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
    if (dt.date) {
      return new Date(dt.date + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
    return "—";
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
                    style={{ backgroundColor: cal.backgroundColor || "#4285F4" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cal.summary}</p>
                    <p className="text-[10px] text-muted-foreground">{cal.accessRole}</p>
                  </div>
                  {cal.primary && (
                    <Badge variant="outline" className="text-[10px]">
                      Primary
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                    <CalendarDays className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {event.summary || "Untitled Event"}
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
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      event.start.date
                        ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
                        : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    }`}
                  >
                    {event.start.date ? "All day" : "Timed"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
