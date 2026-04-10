"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  Video,
  Calendar,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { InPersonRecorder } from "./in-person-recorder";
import type { MeetingRow } from "./types";

interface NewMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeetingCreated: (meeting: MeetingRow) => void;
}

type Step = "choose-type" | "virtual-setup" | "schedule-setup";

export function NewMeetingDialog({
  open,
  onOpenChange,
  onMeetingCreated,
}: NewMeetingDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose-type");
  const [recorderOpen, setRecorderOpen] = useState(false);

  // Virtual meeting state
  const [meetingUrl, setMeetingUrl] = useState("");
  const [virtualTitle, setVirtualTitle] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Schedule state
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [schedulePlatform, setSchedulePlatform] = useState<string>("GOOGLE_MEET");
  const [scheduling, setScheduling] = useState(false);

  const reset = useCallback(() => {
    setStep("choose-type");
    setMeetingUrl("");
    setVirtualTitle("");
    setError(null);
    setDeploying(false);
    setScheduleTitle("");
    setScheduleDescription("");
    setScheduleDate("");
    setScheduleTime("");
    setSchedulePlatform("GOOGLE_MEET");
    setScheduling(false);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset]
  );

  // In-Person: open the recorder
  const handleInPerson = useCallback(() => {
    onOpenChange(false);
    setRecorderOpen(true);
  }, [onOpenChange]);

  const handleRecordingComplete = useCallback(
    (meeting: MeetingRow) => {
      setRecorderOpen(false);
      onMeetingCreated(meeting);
      router.push(`/admin/blocks/meetings/${meeting.id}`);
    },
    [router, onMeetingCreated]
  );

  // Virtual: deploy bot
  const handleDeployBot = useCallback(async () => {
    if (!meetingUrl.trim()) {
      setError("Please enter a meeting link");
      return;
    }

    setDeploying(true);
    setError(null);

    try {
      const res = await fetch("/api/meetings/schedule-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingUrl: meetingUrl.trim(),
          title: virtualTitle.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to deploy recording bot");
      }

      const { data } = await res.json();
      onMeetingCreated(data.meeting);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeploying(false);
    }
  }, [meetingUrl, virtualTitle, onMeetingCreated, handleOpenChange]);

  // Schedule: create a scheduled meeting
  const handleSchedule = useCallback(async () => {
    if (!scheduleTitle.trim()) {
      setError("Please enter a title");
      return;
    }
    if (!scheduleDate || !scheduleTime) {
      setError("Please select a date and time");
      return;
    }

    setScheduling(true);
    setError(null);

    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scheduleTitle.trim(),
          description: scheduleDescription.trim() || undefined,
          meetingType: "VIRTUAL",
          platform: schedulePlatform,
          status: "SCHEDULED",
          scheduledAt,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to schedule meeting");
      }

      const { data } = await res.json();
      onMeetingCreated(data);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setScheduling(false);
    }
  }, [
    scheduleTitle,
    scheduleDescription,
    scheduleDate,
    scheduleTime,
    schedulePlatform,
    onMeetingCreated,
    handleOpenChange,
  ]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          {step === "choose-type" && (
            <>
              <DialogHeader>
                <DialogTitle>New Meeting</DialogTitle>
                <DialogDescription>
                  Choose how you'd like to capture this meeting.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 py-4">
                <button
                  onClick={() => setStep("virtual-setup")}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Video className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Join Virtual Meeting</p>
                    <p className="text-xs text-muted-foreground">
                      Paste a Google Meet, Zoom, or Teams link to record
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  onClick={handleInPerson}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Mic className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Record In-Person</p>
                    <p className="text-xs text-muted-foreground">
                      Use your microphone to record a live meeting
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => setStep("schedule-setup")}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                    <Calendar className="h-5 w-5 text-violet-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Schedule Meeting</p>
                    <p className="text-xs text-muted-foreground">
                      Plan a future meeting to be recorded automatically
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </>
          )}

          {step === "virtual-setup" && (
            <>
              <DialogHeader>
                <DialogTitle>Join Virtual Meeting</DialogTitle>
                <DialogDescription>
                  Paste the meeting link and we'll send a recording bot to
                  capture the conversation.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="virtual-title">Meeting Title (optional)</Label>
                  <Input
                    id="virtual-title"
                    placeholder="e.g. Weekly Standup"
                    value={virtualTitle}
                    onChange={(e) => setVirtualTitle(e.target.value)}
                    disabled={deploying}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-url">Meeting Link</Label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="meeting-url"
                      placeholder="https://meet.google.com/abc-defg-hij"
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      disabled={deploying}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports Google Meet, Zoom, and Microsoft Teams
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("choose-type");
                    setError(null);
                  }}
                  disabled={deploying}
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Back
                </Button>
                <Button onClick={handleDeployBot} disabled={deploying}>
                  {deploying ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Video className="h-4 w-4 mr-1.5" />
                  )}
                  {deploying ? "Deploying Bot..." : "Start Recording"}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "schedule-setup" && (
            <>
              <DialogHeader>
                <DialogTitle>Schedule Meeting</DialogTitle>
                <DialogDescription>
                  Create a scheduled meeting. If a recording bot is connected,
                  it will join automatically.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="schedule-title">Title</Label>
                  <Input
                    id="schedule-title"
                    placeholder="e.g. Q2 Planning Review"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    disabled={scheduling}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-desc">Description (optional)</Label>
                  <Textarea
                    id="schedule-desc"
                    placeholder="Meeting agenda or notes..."
                    value={scheduleDescription}
                    onChange={(e) => setScheduleDescription(e.target.value)}
                    disabled={scheduling}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-date">Date</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      disabled={scheduling}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-time">Time</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      disabled={scheduling}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <div className="flex gap-2">
                    {[
                      { value: "GOOGLE_MEET", label: "Google Meet" },
                      { value: "ZOOM", label: "Zoom" },
                      { value: "MICROSOFT_TEAMS", label: "Teams" },
                    ].map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setSchedulePlatform(p.value)}
                        disabled={scheduling}
                        className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                          schedulePlatform === p.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("choose-type");
                    setError(null);
                  }}
                  disabled={scheduling}
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Back
                </Button>
                <Button onClick={handleSchedule} disabled={scheduling}>
                  {scheduling ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-1.5" />
                  )}
                  {scheduling ? "Scheduling..." : "Schedule Meeting"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <InPersonRecorder
        open={recorderOpen}
        onOpenChange={setRecorderOpen}
        onComplete={handleRecordingComplete}
      />
    </>
  );
}
