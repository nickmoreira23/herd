"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  Clock,
  Users,
  CalendarDays,
  Disc,
} from "lucide-react";
import type { IntegrationOverviewProps } from "./index";

// ─── Types ───────────────────────────────────────────────────────

interface UserProfile {
  display_name: string;
  email: string;
  type: number;
  role_name: string;
  pmi: number;
  personal_meeting_url: string;
  status: string;
  pic_url: string;
}

interface MeetingSummary {
  id: number;
  uuid: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  join_url: string;
  created_at: string;
}

// ─── Component ───────────────────────────────────────────────────

export default function ZoomOverview({
  isConnected,
}: IntegrationOverviewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meetings, setMeetings] = useState<MeetingSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    fetch("/api/integrations/zoom/user")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.profile) setProfile(json.data.profile);
        else setError(json.error || "Failed to load profile");
      })
      .catch(() => setError("Network error"));

    fetch("/api/integrations/zoom/meetings?type=upcoming_meetings&pageSize=8")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.meetings?.meetings) setMeetings(json.data.meetings.meetings);
      })
      .catch(() => {});
  }, [isConnected]);

  // ─── Not Connected State ──────────────────────────────────────

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <Video className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect Zoom to see your upcoming meetings and recordings.
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
            <Video className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-red-500 text-center">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try refreshing the page or reconnecting Zoom.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────

  const formatMeetingTime = (startTime: string) => {
    return new Date(startTime).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const meetingTypeLabel = (type: number) => {
    switch (type) {
      case 1: return "Instant";
      case 2: return "Scheduled";
      case 3: return "Recurring";
      case 8: return "Recurring";
      default: return "Meeting";
    }
  };

  const accountType = (type: number) => {
    switch (type) {
      case 1: return "Basic";
      case 2: return "Licensed";
      case 3: return "On-Prem";
      default: return "Unknown";
    }
  };

  // ─── Loaded State ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              {profile.pic_url && (
                <img
                  src={profile.pic_url}
                  alt={profile.display_name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium">{profile.display_name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <div className="flex gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {accountType(profile.type)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {profile.role_name}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="rounded-lg border px-4 py-3 text-center">
                <p className="text-2xl font-bold tabular-nums text-blue-500">
                  {meetings?.length ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
              <div className="rounded-lg border px-4 py-3 text-center">
                <p className="text-2xl font-bold tabular-nums text-violet-500">
                  {profile.pmi}
                </p>
                <p className="text-xs text-muted-foreground">Personal ID</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Meetings */}
      {meetings && meetings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {meetings.map((meeting) => (
                <div
                  key={meeting.uuid}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                    <Video className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {meeting.topic || "Untitled Meeting"}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      <span>{formatMeetingTime(meeting.start_time)}</span>
                      <Clock className="h-3 w-3 ml-1" />
                      <span>{formatDuration(meeting.duration)}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20"
                  >
                    {meetingTypeLabel(meeting.type)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {meetings && meetings.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Disc className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No upcoming Zoom meetings scheduled.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
