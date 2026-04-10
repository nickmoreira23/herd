"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Video,
  Mic,
  Clock,
  Users,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  ExternalLink,
  BookOpen,
  Database,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { MeetingRow, ActionItem } from "./types";

interface MeetingDetailClientProps {
  initialMeeting: MeetingRow;
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
  MICROSOFT_TEAMS: "Microsoft Teams",
  IN_PERSON: "In-Person",
  OTHER: "Other",
};

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs >= 1) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Color palette for speaker labels
const SPEAKER_COLORS = [
  "text-blue-400",
  "text-emerald-400",
  "text-violet-400",
  "text-amber-400",
  "text-cyan-400",
  "text-rose-400",
  "text-lime-400",
  "text-fuchsia-400",
];

function getSpeakerColor(speaker: string): string {
  // Extract speaker number and use as index
  const match = speaker.match(/Speaker\s+(\d+)/i);
  if (match) {
    const idx = (parseInt(match[1], 10) - 1) % SPEAKER_COLORS.length;
    return SPEAKER_COLORS[idx];
  }
  return SPEAKER_COLORS[0];
}

export function MeetingDetailClient({ initialMeeting }: MeetingDetailClientProps) {
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingRow>(initialMeeting);
  const [summarizing, setSummarizing] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [savingToKnowledge, setSavingToKnowledge] = useState(false);
  const [savedToKnowledge, setSavedToKnowledge] = useState(false);

  const status = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.SCHEDULED;
  const PlatformIcon = meeting.platform === "IN_PERSON" ? Mic : Video;

  const handleSummarize = useCallback(async () => {
    setSummarizing(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/summarize`, {
        method: "POST",
      });
      if (res.ok) {
        const { data } = await res.json();
        setMeeting((prev) => ({ ...prev, ...data }));
      }
    } finally {
      setSummarizing(false);
    }
  }, [meeting.id]);

  const [retrying, setRetrying] = useState(false);

  const handleRetryProcessing = useCallback(async () => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/process`, {
        method: "POST",
      });
      if (res.ok) {
        const { data } = await res.json();
        setMeeting((prev) => ({ ...prev, ...data }));
      } else {
        const errBody = await res.json().catch(() => null);
        setMeeting((prev) => ({
          ...prev,
          errorMessage: errBody?.error || "Processing failed. Please try again.",
        }));
      }
    } finally {
      setRetrying(false);
    }
  }, [meeting.id]);

  const handleToggleActionItem = useCallback(
    async (index: number) => {
      const items = [...(meeting.actionItems || [])];
      items[index] = { ...items[index], completed: !items[index].completed };

      const res = await fetch(`/api/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionItems: items }),
      });

      if (res.ok) {
        setMeeting((prev) => ({ ...prev, actionItems: items }));
      }
    },
    [meeting.id, meeting.actionItems]
  );

  const handleGenerateBriefing = useCallback(async () => {
    setBriefingLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/briefing`);
      if (res.ok) {
        const { data } = await res.json();
        setBriefing(data.briefing);
      }
    } finally {
      setBriefingLoading(false);
    }
  }, [meeting.id]);

  const handleSaveToKnowledge = useCallback(async () => {
    setSavingToKnowledge(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/knowledge`, {
        method: "POST",
      });
      if (res.ok) {
        setSavedToKnowledge(true);
      }
    } finally {
      setSavingToKnowledge(false);
    }
  }, [meeting.id]);

  // Parse transcript into lines with speaker labels
  const transcriptLines = meeting.transcript
    ? meeting.transcript.split("\n").map((line) => {
        const match = line.match(/^\[([^\]]+)\s*-\s*([^\]]+)\]\s*(.*)$/);
        if (match) {
          return { timestamp: match[1], speaker: match[2], text: match[3] };
        }
        return { timestamp: null, speaker: null, text: line };
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-start gap-4 pl-4 pt-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/admin/blocks/meetings")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {meeting.title}
            </h1>
            <Badge
              variant="outline"
              className={`text-xs font-medium shrink-0 ${status.className}`}
            >
              {status.label}
            </Badge>
          </div>
          {meeting.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {meeting.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <PlatformIcon className="h-3.5 w-3.5" />
              {PLATFORM_LABELS[meeting.platform]}
            </span>
            {meeting.duration != null && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(meeting.duration)}
              </span>
            )}
            {meeting.participantCount != null && meeting.participantCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {meeting.participantCount} participant{meeting.participantCount !== 1 ? "s" : ""}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(meeting.startedAt || meeting.createdAt)}
            </span>
            {meeting.meetingUrl && (
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Meeting Link
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Transcript + Audio */}
        <div className="lg:col-span-2 space-y-4">
          {/* Audio player */}
          {meeting.audioFileUrl && (
            <Card className="p-4">
              <audio
                controls
                className="w-full"
                src={meeting.audioFileUrl}
                preload="metadata"
              />
            </Card>
          )}

          {/* Transcript */}
          {meeting.transcript ? (
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">Transcript</h2>
              </div>
              <div className="max-h-[600px] overflow-y-auto p-4 space-y-2">
                {transcriptLines.map((line, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    {line.timestamp && (
                      <span className="text-xs text-muted-foreground/60 tabular-nums whitespace-nowrap pt-0.5 min-w-[52px]">
                        {line.timestamp}
                      </span>
                    )}
                    {line.speaker && (
                      <span
                        className={`text-xs font-medium whitespace-nowrap pt-0.5 min-w-[72px] ${getSpeakerColor(line.speaker)}`}
                      >
                        {line.speaker}
                      </span>
                    )}
                    <span className="text-foreground/90 leading-relaxed">
                      {line.text}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : meeting.status === "PROCESSING" ? (
            <Card className="p-8 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Transcribing audio...
              </p>
            </Card>
          ) : meeting.errorMessage ? (
            <Card className="p-4 flex flex-col items-center gap-3">
              <p className="text-sm text-destructive text-center">{meeting.errorMessage}</p>
              {meeting.audioFileUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetryProcessing}
                  disabled={retrying}
                >
                  {retrying ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Mic className="h-4 w-4 mr-1.5" />
                  )}
                  Retry Transcription
                </Button>
              )}
            </Card>
          ) : null}
        </div>

        {/* Right column: Summary + Action Items + Topics */}
        <div className="space-y-4">
          {/* AI Summary */}
          {meeting.summary ? (
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                <h2 className="text-sm font-semibold">AI Summary</h2>
              </div>
              <div className="p-4">
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {meeting.summary}
                </p>
              </div>
            </Card>
          ) : (
            meeting.status === "READY" &&
            meeting.transcript && (
              <Card className="p-4 flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground text-center">
                  Generate an AI summary with action items and key topics.
                </p>
                <Button
                  size="sm"
                  onClick={handleSummarize}
                  disabled={summarizing}
                >
                  {summarizing ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1.5" />
                  )}
                  Generate Summary
                </Button>
              </Card>
            )
          )}

          {/* Action Items */}
          {meeting.actionItems && meeting.actionItems.length > 0 && (
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">
                  Action Items ({meeting.actionItems.length})
                </h2>
              </div>
              <div className="p-4 space-y-2">
                {meeting.actionItems.map((item: ActionItem, i: number) => (
                  <button
                    key={i}
                    className="flex items-start gap-2 w-full text-left group"
                    onClick={() => handleToggleActionItem(i)}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}
                      >
                        {item.text}
                      </span>
                      {item.assignee && (
                        <span className="text-xs text-muted-foreground block">
                          {item.assignee}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Key Topics */}
          {meeting.keyTopics && meeting.keyTopics.length > 0 && (
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">Key Topics</h2>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {meeting.keyTopics.map((topic, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/20"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Participants */}
          {meeting.participants && meeting.participants.length > 0 && (
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">Participants</h2>
              </div>
              <div className="p-4 space-y-2">
                {meeting.participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{p.name}</span>
                      {p.email && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {p.email}
                        </span>
                      )}
                    </div>
                    {p.speakerLabel && (
                      <span
                        className={`text-xs font-medium ${getSpeakerColor(p.speakerLabel)}`}
                      >
                        {p.speakerLabel}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Pre-Meeting Briefing */}
          {meeting.status === "SCHEDULED" &&
            meeting.participants &&
            meeting.participants.length > 0 && (
              <Card className="p-0">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                  <h2 className="text-sm font-semibold">Pre-Meeting Briefing</h2>
                </div>
                <div className="p-4">
                  {briefing ? (
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                      {briefing}
                    </p>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-sm text-muted-foreground text-center">
                        Generate a briefing based on past meetings with these
                        attendees.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateBriefing}
                        disabled={briefingLoading}
                      >
                        {briefingLoading ? (
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4 mr-1.5" />
                        )}
                        Generate Briefing
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

          {/* Save to Knowledge Base */}
          {meeting.status === "READY" && meeting.transcript && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 shrink-0">
                  <Database className="h-4 w-4 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Knowledge Base</p>
                  <p className="text-xs text-muted-foreground">
                    {savedToKnowledge
                      ? "Saved to knowledge base"
                      : "Save transcript and insights to the knowledge base"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={savedToKnowledge ? "outline" : "default"}
                  onClick={handleSaveToKnowledge}
                  disabled={savingToKnowledge || savedToKnowledge}
                  className="shrink-0"
                >
                  {savingToKnowledge ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : savedToKnowledge ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
