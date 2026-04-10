"use client";

import { useState, useCallback, useEffect } from "react";
import {
  MapPin,
  Video,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  X,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { CalendarSyncRow } from "./types";

// ─── Types ──────────────────────────────────────────────────────

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendars: CalendarSyncRow[];
  prefillDate: Date | null;
  onEventCreated: () => void;
}

type Step = "choose-type" | "event-details";
type EventType = "in-person" | "virtual";

const PLATFORMS = [
  { value: "GOOGLE_MEET", label: "Google Meet" },
  { value: "ZOOM", label: "Zoom" },
  { value: "MICROSOFT_TEAMS", label: "Teams" },
  { value: "SLACK", label: "Slack" },
];

// ─── Component ──────────────────────────────────────────────────

export function CreateEventDialog({
  open,
  onOpenChange,
  calendars,
  prefillDate,
  onEventCreated,
}: CreateEventDialogProps) {
  const [step, setStep] = useState<Step>("choose-type");
  const [eventType, setEventType] = useState<EventType>("virtual");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [platform, setPlatform] = useState("GOOGLE_MEET");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [attendeeInput, setAttendeeInput] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep("choose-type");
    setEventType("virtual");
    setTitle("");
    setDescription("");
    setDate("");
    setStartTime("09:00");
    setEndTime("10:00");
    setIsAllDay(false);
    setLocation("");
    setPlatform("GOOGLE_MEET");
    setMeetingUrl("");
    setCalendarId("");
    setAttendeeInput("");
    setAttendees([]);
    setCreating(false);
    setError(null);
  }, []);

  // Pre-fill date/time when dialog opens with a prefillDate
  useEffect(() => {
    if (open && prefillDate) {
      const d = prefillDate;
      setDate(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      );
      const hrs = d.getHours();
      setStartTime(
        `${String(hrs).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
      setEndTime(
        `${String(Math.min(hrs + 1, 23)).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
      if (calendars.length > 0 && !calendarId) {
        setCalendarId(calendars[0].id);
      }
    }
  }, [open, prefillDate, calendars, calendarId]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset]
  );

  const handleChooseType = (type: EventType) => {
    setEventType(type);
    setStep("event-details");
    if (calendars.length > 0 && !calendarId) {
      setCalendarId(calendars[0].id);
    }
  };

  const handleAddAttendee = () => {
    const email = attendeeInput.trim();
    if (email && email.includes("@") && !attendees.includes(email)) {
      setAttendees((prev) => [...prev, email]);
      setAttendeeInput("");
    }
  };

  const handleRemoveAttendee = (email: string) => {
    setAttendees((prev) => prev.filter((a) => a !== email));
  };

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    if (!date) {
      setError("Please select a date");
      return;
    }
    if (!calendarId) {
      setError("Please select a calendar");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const startAt = isAllDay
        ? new Date(`${date}T00:00:00`).toISOString()
        : new Date(`${date}T${startTime}`).toISOString();
      const endAt = isAllDay
        ? new Date(`${date}T23:59:59`).toISOString()
        : new Date(`${date}T${endTime}`).toISOString();

      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          location: eventType === "in-person" ? location.trim() || undefined : undefined,
          startAt,
          endAt,
          isAllDay,
          calendarSyncId: calendarId,
          platform: eventType === "virtual" ? platform : undefined,
          meetingUrl: eventType === "virtual" ? meetingUrl.trim() || undefined : undefined,
          attendees: attendees.map((email) => ({ email })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to create event");
      }

      onEventCreated();
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }, [
    title,
    description,
    date,
    startTime,
    endTime,
    isAllDay,
    location,
    eventType,
    platform,
    meetingUrl,
    calendarId,
    attendees,
    onEventCreated,
    handleOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "choose-type" && (
          <>
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
              <DialogDescription>
                Choose the type of event you&apos;d like to create.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              <button
                onClick={() => handleChooseType("in-person")}
                className="flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">In-Person Event</p>
                  <p className="text-xs text-muted-foreground">
                    An event with a physical location
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => handleChooseType("virtual")}
                className="flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Video className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Virtual Event</p>
                  <p className="text-xs text-muted-foreground">
                    An online meeting via Google Meet, Zoom, Teams, or Slack
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </>
        )}

        {step === "event-details" && (
          <>
            <DialogHeader>
              <DialogTitle>
                {eventType === "in-person"
                  ? "In-Person Event"
                  : "Virtual Event"}
              </DialogTitle>
              <DialogDescription>
                Fill in the event details below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  placeholder="e.g. Team Standup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={creating}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="event-desc">Description (optional)</Label>
                <Textarea
                  id="event-desc"
                  placeholder="Event details or agenda..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={creating}
                  rows={2}
                />
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="all-day">All Day</Label>
                <Switch
                  id="all-day"
                  checked={isAllDay}
                  onCheckedChange={setIsAllDay}
                  disabled={creating}
                />
              </div>

              {/* Date & Time */}
              <div
                className={`grid gap-3 ${isAllDay ? "grid-cols-1" : "grid-cols-3"}`}
              >
                <div className="space-y-2">
                  <Label htmlFor="event-date">Date</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={creating}
                  />
                </div>
                {!isAllDay && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="event-start">Start</Label>
                      <Input
                        id="event-start"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        disabled={creating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-end">End</Label>
                      <Input
                        id="event-end"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        disabled={creating}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* In-Person: Location */}
              {eventType === "in-person" && (
                <div className="space-y-2">
                  <Label htmlFor="event-location">Location</Label>
                  <Input
                    id="event-location"
                    placeholder="e.g. Conference Room A"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={creating}
                  />
                </div>
              )}

              {/* Virtual: Platform + URL */}
              {eventType === "virtual" && (
                <>
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <div className="flex gap-2">
                      {PLATFORMS.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setPlatform(p.value)}
                          disabled={creating}
                          className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                            platform === p.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meeting-url">
                      Meeting URL (optional)
                    </Label>
                    <Input
                      id="meeting-url"
                      placeholder="https://meet.google.com/..."
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      disabled={creating}
                    />
                  </div>
                </>
              )}

              {/* Calendar Selector */}
              {calendars.length > 0 && (
                <div className="space-y-2">
                  <Label>Calendar</Label>
                  <Select
                    value={calendarId}
                    onValueChange={setCalendarId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendars
                        .filter((c) => c.isActive)
                        .map((cal) => (
                          <SelectItem key={cal.id} value={cal.id}>
                            <div className="flex items-center gap-2">
                              {cal.calendarColor && (
                                <span
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: cal.calendarColor,
                                  }}
                                />
                              )}
                              {cal.calendarName}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Attendees */}
              <div className="space-y-2">
                <Label>Attendees</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="email@example.com"
                    value={attendeeInput}
                    onChange={(e) => setAttendeeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAttendee();
                      }
                    }}
                    disabled={creating}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAttendee}
                    disabled={creating}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {attendees.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {attendees.map((email) => (
                      <Badge
                        key={email}
                        variant="secondary"
                        className="gap-1"
                      >
                        {email}
                        <button
                          onClick={() => handleRemoveAttendee(email)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">
                  {error}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("choose-type");
                  setError(null);
                }}
                disabled={creating}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 mr-1.5" />
                )}
                {creating ? "Creating..." : "Create Event"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
