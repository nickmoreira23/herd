"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Video,
  Mic,
  Clock,
  Users,
  Sparkles,
  MoreHorizontal,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Bot,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMeetingColumns } from "./meeting-columns";
import { NewMeetingDialog } from "./new-meeting-dialog";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef } from "@/components/shared/block-list-page/types";
import type { MeetingRow } from "./types";

interface MeetingsListClientProps {
  initialMeetings: MeetingRow[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: "Scheduled", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  RECORDING: { label: "Recording", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  PROCESSING: { label: "Processing", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  READY: { label: "Ready", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  ERROR: { label: "Error", className: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const PLATFORM_LABELS: Record<string, string> = {
  GOOGLE_MEET: "Google Meet",
  ZOOM: "Zoom",
  MICROSOFT_TEAMS: "Teams",
  OTHER: "Other",
};

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs >= 1) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Card View ──────────────────────────────────────────────────────

function MeetingCard({
  meeting,
  onView,
  onDelete,
}: {
  meeting: MeetingRow;
  onView: (m: MeetingRow) => void;
  onDelete: (m: MeetingRow) => void;
}) {
  const status = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.SCHEDULED;
  const isInPerson = meeting.meetingType === "IN_PERSON";
  const dateStr = meeting.startedAt || meeting.scheduledAt || meeting.createdAt;

  return (
    <Card
      className="p-0 cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => onView(meeting)}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                isInPerson ? "bg-emerald-500/10" : "bg-blue-500/10"
              }`}
            >
              {isInPerson ? (
                <Mic className="h-4 w-4 text-emerald-500" />
              ) : (
                <Video className="h-4 w-4 text-blue-500" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{meeting.title}</p>
              <p className="text-xs text-muted-foreground">
                {isInPerson
                  ? "In-Person"
                  : PLATFORM_LABELS[meeting.platform] || meeting.platform}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="outline"
              className={`text-[10px] font-medium ${status.className}`}
            >
              {status.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  />
                }
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(meeting);
                  }}
                >
                  <Eye className="mr-2 h-3.5 w-3.5" />
                  View
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(meeting);
                  }}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Description */}
        {meeting.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {meeting.description}
          </p>
        )}

        {/* Summary preview */}
        {meeting.summary && (
          <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">
            {meeting.summary}
          </p>
        )}

        {/* Key topics */}
        {meeting.keyTopics && meeting.keyTopics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meeting.keyTopics.slice(0, 3).map((topic, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400"
              >
                {topic}
              </span>
            ))}
            {meeting.keyTopics.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                +{meeting.keyTopics.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
          <span className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            {formatDate(dateStr)}
          </span>
          {meeting.duration != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(meeting.duration)}
            </span>
          )}
          {meeting.participantCount != null && meeting.participantCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {meeting.participantCount}
            </span>
          )}
          {meeting.summary && (
            <Sparkles className="h-3 w-3 text-violet-400 ml-auto" />
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Card Grid ──────────────────────────────────────────────────────

function MeetingCardGrid({
  meetings,
  onView,
  onDelete,
}: {
  meetings: MeetingRow[];
  onView: (m: MeetingRow) => void;
  onDelete: (m: MeetingRow) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {meetings.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          onView={onView}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// ─── Calendar View ──────────────────────────────────────────────────

function CalendarView({
  meetings,
  onView,
}: {
  meetings: MeetingRow[];
  onView: (m: MeetingRow) => void;
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthLabel = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Group meetings by day
  const meetingsByDay = useMemo(() => {
    const map = new Map<number, MeetingRow[]>();
    for (const m of meetings) {
      const dateStr = m.startedAt || m.scheduledAt || m.createdAt;
      const d = new Date(dateStr);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        const list = map.get(day) || [];
        list.push(m);
        map.set(day, list);
      }
    }
    return map;
  }, [meetings, year, month]);

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const cells: React.ReactNode[] = [];

  // Empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-border" />);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayMeetings = meetingsByDay.get(day) || [];
    cells.push(
      <div
        key={day}
        className="min-h-[100px] border-b border-r border-border p-1"
      >
        <div
          className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
            isToday(day) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          {day}
        </div>
        <div className="space-y-0.5">
          {dayMeetings.slice(0, 3).map((m) => {
            const timeStr = m.startedAt || m.scheduledAt;
            return (
              <button
                key={m.id}
                onClick={() => onView(m)}
                className="w-full text-left rounded px-1 py-0.5 text-[10px] leading-tight truncate hover:bg-muted/80 transition-colors"
                style={{
                  borderLeft: `2px solid`,
                  borderColor: m.status === "READY"
                    ? "rgb(16 185 129)"
                    : m.status === "SCHEDULED"
                    ? "rgb(59 130 246)"
                    : m.status === "ERROR"
                    ? "rgb(239 68 68)"
                    : "rgb(245 158 11)",
                }}
              >
                <span className="font-medium">{m.title}</span>
                {timeStr && (
                  <span className="text-muted-foreground ml-1">
                    {formatTime(timeStr)}
                  </span>
                )}
              </button>
            );
          })}
          {dayMeetings.length > 3 && (
            <p className="text-[10px] text-muted-foreground px-1">
              +{dayMeetings.length - 3} more
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-7 px-2">
            Today
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-l border-t border-border rounded-t-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-xs font-medium text-muted-foreground text-center py-2 border-b border-r border-border bg-muted/30"
          >
            {d}
          </div>
        ))}
        {cells}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function MeetingsListClient({ initialMeetings }: MeetingsListClientProps) {
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingRow[]>(initialMeetings);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleView = useCallback(
    (meeting: MeetingRow) => {
      router.push(`/admin/blocks/meetings/${meeting.id}`);
    },
    [router]
  );

  const handleDelete = useCallback(async (meeting: MeetingRow) => {
    if (!confirm(`Delete "${meeting.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/meetings/${meeting.id}`, { method: "DELETE" });
    if (res.ok) {
      setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
    }
  }, []);

  const handleSummarize = useCallback(async (meeting: MeetingRow) => {
    const res = await fetch(`/api/meetings/${meeting.id}/summarize`, {
      method: "POST",
    });
    if (res.ok) {
      const { data } = await res.json();
      setMeetings((prev) =>
        prev.map((m) => (m.id === data.id ? { ...m, ...data } : m))
      );
    }
  }, []);

  const handleMeetingCreated = useCallback(
    (meeting: MeetingRow) => {
      setMeetings((prev) => [meeting, ...prev]);
      setDialogOpen(false);
    },
    []
  );

  const columns = getMeetingColumns({
    onView: handleView,
    onDelete: handleDelete,
    onSummarize: handleSummarize,
  });

  // Count by type for filter options
  const virtualCount = meetings.filter((m) => m.meetingType === "VIRTUAL").length;
  const inPersonCount = meetings.filter((m) => m.meetingType === "IN_PERSON").length;

  // ── Filters ───────────────────────────────────────────────────────

  const filters: FilterDef<MeetingRow>[] = [
    {
      key: "meetingType",
      label: "All Meetings",
      options: [
        { value: "VIRTUAL", label: `Virtual (${virtualCount})` },
        { value: "IN_PERSON", label: `In-Person (${inPersonCount})` },
      ],
      filterFn: (item, value) => item.meetingType === value,
    },
  ];

  // ── Header Actions ────────────────────────────────────────────────

  const headerActions = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/admin/blocks/meetings/agent-settings")}
      >
        <Bot className="h-4 w-4 mr-1.5" />
        Agent Settings
      </Button>
      <Button size="sm" onClick={() => setDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-1.5" />
        New Meeting
      </Button>
    </>
  );

  // ── Modals ────────────────────────────────────────────────────────

  const modals = (
    <NewMeetingDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      onMeetingCreated={handleMeetingCreated}
    />
  );

  // ── Render ────────────────────────────────────────────────────────

  return (
    <BlockListPage<MeetingRow>
      blockName="meetings"
      title="Meetings"
      description="Record, transcribe, and analyze meetings"
      data={meetings}
      getId={(m) => m.id}
      columns={columns}
      onRowClick={handleView}
      searchPlaceholder="Search meetings..."
      searchFn={(m, q) =>
        m.title.toLowerCase().includes(q) ||
        (m.description?.toLowerCase().includes(q) ?? false) ||
        (m.keyTopics?.some((t) => t.toLowerCase().includes(q)) ?? false)
      }
      filters={filters}
      additionalViews={[
        {
          type: "card" as const,
          render: (data) => (
            <MeetingCardGrid
              meetings={data}
              onView={handleView}
              onDelete={handleDelete}
            />
          ),
        },
        {
          type: "calendar" as const,
          render: (data) => (
            <CalendarView meetings={data} onView={handleView} />
          ),
        },
      ]}
      headerActions={headerActions}
      modals={modals}
    />
  );
}
