"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  ExternalLink,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CalendarEventRow } from "./types";

interface EventDetailClientProps {
  initialEvent: CalendarEventRow;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
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

const RESPONSE_CONFIG: Record<string, { label: string; className: string }> = {
  accepted: {
    label: "Accepted",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  declined: {
    label: "Declined",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  tentative: {
    label: "Maybe",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  needsAction: {
    label: "Pending",
    className: "bg-muted text-muted-foreground border-muted",
  },
};

function formatDateTime(dateStr: string, isAllDay: boolean): string {
  const date = new Date(dateStr);
  if (isAllDay) {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return date.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startAt: string, endAt: string): string {
  const ms = new Date(endAt).getTime() - new Date(startAt).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 1) return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
  return `${mins}m`;
}

export function EventDetailClient({ initialEvent }: EventDetailClientProps) {
  const router = useRouter();
  const event = initialEvent;
  const status = STATUS_CONFIG[event.status] || STATUS_CONFIG.CONFIRMED;

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-start gap-4 pl-4 pt-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/admin/blocks/events")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {event.title}
            </h1>
            <Badge
              variant="outline"
              className={`text-xs font-medium shrink-0 ${status.className}`}
            >
              {status.label}
            </Badge>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {event.isAllDay
                ? formatDateTime(event.startAt, true)
                : `${formatDateTime(event.startAt, false)} – ${formatDateTime(event.endAt, false)}`}
            </span>
            {!event.isAllDay && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(event.startAt, event.endAt)}
              </span>
            )}
            {event.attendees.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {event.attendees.length} attendee
                {event.attendees.length !== 1 ? "s" : ""}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
            {event.meetingUrl && (
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Video className="h-3.5 w-3.5" />
                Join Meeting
              </a>
            )}
            {event.htmlLink && (
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Calendar
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Description + Calendar Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          {event.description && (
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">Description</h2>
              </div>
              <div className="p-4">
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </Card>
          )}

          {/* Calendar Source */}
          <Card className="p-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Calendar</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3">
                {event.calendarSync.calendarColor && (
                  <span
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: event.calendarSync.calendarColor }}
                  />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {event.calendarSync.calendarName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.calendarSync.source === "GOOGLE_CALENDAR"
                      ? "Google Calendar"
                      : event.calendarSync.source}
                  </p>
                </div>
              </div>
              {event.organizerName || event.organizerEmail ? (
                <div className="mt-3 text-sm">
                  <span className="text-muted-foreground">Organized by </span>
                  <span className="font-medium">
                    {event.organizerName || event.organizerEmail}
                  </span>
                  {event.organizerName && event.organizerEmail && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({event.organizerEmail})
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Right column: Attendees */}
        <div className="space-y-4">
          {event.attendees.length > 0 && (
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">
                  Attendees ({event.attendees.length})
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {event.attendees.map((a) => {
                  const responseConfig =
                    RESPONSE_CONFIG[a.responseStatus] ||
                    RESPONSE_CONFIG.needsAction;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {a.displayName || a.email}
                          {a.isOrganizer && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (organizer)
                            </span>
                          )}
                          {a.isSelf && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (you)
                            </span>
                          )}
                        </span>
                        {a.displayName && (
                          <span className="text-xs text-muted-foreground truncate block">
                            {a.email}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${responseConfig.className}`}
                      >
                        {responseConfig.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Meeting Link */}
          {event.meetingUrl && (
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-2">Meeting Link</h2>
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Video className="h-3.5 w-3.5" />
                Join Meeting
              </a>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
