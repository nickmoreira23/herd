"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  AlertCircle,
  Calendar,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  BarChart3,
  CheckCircle2,
  Circle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────

interface RecurringTopic {
  topic: string;
  count: number;
  lastMeeting: { id: string; title: string; date: string };
}

interface UnresolvedAction {
  text: string;
  assignee: string | null;
  meetingTitle: string;
  meetingId: string;
  meetingDate: string;
}

interface MeetingFrequency {
  total: number;
  last7Days: number;
  last30Days: number;
  avgDurationMinutes: number;
}

interface TopParticipant {
  name: string;
  email: string | null;
  meetingCount: number;
}

interface InsightsData {
  recurringTopics: RecurringTopic[];
  unresolvedActions: UnresolvedAction[];
  meetingFrequency: MeetingFrequency;
  topParticipants: TopParticipant[];
}

// ─── Component ───────────────────────────────────────────────────

export function MeetingInsights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);

  useEffect(() => {
    fetch("/api/meetings/insights")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Don't render if no data or no processed meetings
  if (!loading && (!data || data.meetingFrequency.total === 0)) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border px-3 py-2 text-center">
                <Skeleton className="h-6 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-14 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { meetingFrequency, recurringTopics, unresolvedActions, topParticipants } = data;
  const visibleActions = showAllActions ? unresolvedActions : unresolvedActions.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Stats Strip + Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-violet-500" />
              Meeting Intelligence
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Expand
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border px-3 py-2 text-center">
              <p className="text-xl font-bold tabular-nums text-blue-500">
                {meetingFrequency.total}
              </p>
              <p className="text-[10px] text-muted-foreground">Total Meetings</p>
            </div>
            <div className="rounded-lg border px-3 py-2 text-center">
              <p className="text-xl font-bold tabular-nums text-emerald-500">
                {meetingFrequency.last7Days}
              </p>
              <p className="text-[10px] text-muted-foreground">Last 7 Days</p>
            </div>
            <div className="rounded-lg border px-3 py-2 text-center">
              <p className="text-xl font-bold tabular-nums text-violet-500">
                {meetingFrequency.last30Days}
              </p>
              <p className="text-[10px] text-muted-foreground">Last 30 Days</p>
            </div>
            <div className="rounded-lg border px-3 py-2 text-center">
              <p className="text-xl font-bold tabular-nums text-amber-500">
                {meetingFrequency.avgDurationMinutes}m
              </p>
              <p className="text-[10px] text-muted-foreground">Avg Duration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Content */}
      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recurring Topics */}
          {recurringTopics.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Recurring Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recurringTopics.slice(0, 8).map((topic, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate capitalize">
                          {topic.topic}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Last: {topic.lastMeeting.title}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0"
                      >
                        {topic.count}x
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unresolved Action Items */}
          {unresolvedActions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Unresolved Action Items
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    {unresolvedActions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {visibleActions.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-lg border p-2.5"
                    >
                      <Circle className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs leading-relaxed">
                          {action.text}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {action.assignee && (
                            <span className="text-[10px] text-muted-foreground">
                              {action.assignee}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            from {action.meetingTitle}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {unresolvedActions.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-7"
                      onClick={() => setShowAllActions(!showAllActions)}
                    >
                      {showAllActions
                        ? "Show less"
                        : `Show ${unresolvedActions.length - 5} more`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Participants */}
          {topParticipants.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Top Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topParticipants.slice(0, 6).map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {p.name}
                          </p>
                          {p.email && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {p.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {p.meetingCount} meeting{p.meetingCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state if no actionable insights */}
          {recurringTopics.length === 0 &&
            unresolvedActions.length === 0 &&
            topParticipants.length === 0 && (
              <Card className="md:col-span-2">
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No cross-meeting patterns detected yet. Process more meetings
                    to see insights.
                  </p>
                </CardContent>
              </Card>
            )}
        </div>
      )}
    </div>
  );
}
