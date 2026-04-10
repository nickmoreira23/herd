"use client";

import { useState } from "react";
import {
  RefreshCw,
  Loader2,
  Clock,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { CalendarSyncRow } from "./types";

// ─── Types ──────────────────────────────────────────────────────

interface EventSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendars: CalendarSyncRow[];
  onSync: () => Promise<void>;
  syncing: boolean;
}

const SYNC_FREQUENCIES = [
  { value: "realtime", label: "Real-time", icon: "⚡" },
  { value: "15min", label: "Every 15 min", icon: null },
  { value: "30min", label: "Every 30 min", icon: null },
  { value: "hourly", label: "Hourly", icon: null },
  { value: "6hours", label: "Every 6 hours", icon: null },
  { value: "daily", label: "Once a day", icon: null },
];

const SYNC_WINDOWS = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
];

// ─── Component ──────────────────────────────────────────────────

export function EventSettingsDialog({
  open,
  onOpenChange,
  calendars,
  onSync,
  syncing,
}: EventSettingsDialogProps) {
  const [syncFrequency, setSyncFrequency] = useState("hourly");
  const [syncWindow, setSyncWindow] = useState("90");
  const [autoCleanup, setAutoCleanup] = useState(true);

  // Find the latest sync time across all calendars
  const lastSyncAt = calendars.reduce<string | null>((latest, cal) => {
    if (!cal.lastSyncAt) return latest;
    if (!latest) return cal.lastSyncAt;
    return new Date(cal.lastSyncAt) > new Date(latest) ? cal.lastSyncAt : latest;
  }, null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Event Settings</DialogTitle>
          <DialogDescription>
            Configure how your calendar events are synced.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Sync Frequency */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Sync Frequency</Label>
            <div className="grid grid-cols-3 gap-2">
              {SYNC_FREQUENCIES.map((freq) => (
                <button
                  key={freq.value}
                  onClick={() => setSyncFrequency(freq.value)}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    syncFrequency === freq.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {freq.icon && <span className="mr-1">{freq.icon}</span>}
                  {freq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sync Window */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Sync Window</Label>
            <p className="text-xs text-muted-foreground -mt-1">
              How far ahead to sync future events
            </p>
            <div className="flex gap-2">
              {SYNC_WINDOWS.map((win) => (
                <button
                  key={win.value}
                  onClick={() => setSyncWindow(win.value)}
                  className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    syncWindow === win.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {win.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Cleanup */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Auto-cleanup</Label>
                <p className="text-xs text-muted-foreground">
                  Remove events older than 90 days
                </p>
              </div>
            </div>
            <Switch
              checked={autoCleanup}
              onCheckedChange={setAutoCleanup}
            />
          </div>

          {/* Last Synced + Sync Now */}
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Synced</p>
                  <p className="text-xs text-muted-foreground">
                    {lastSyncAt
                      ? new Date(lastSyncAt).toLocaleString()
                      : "Never synced"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onSync}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                )}
                Sync Now
              </Button>
            </div>

            {/* Connected calendars summary */}
            {calendars.length > 0 && (
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground mb-1.5">
                  Connected Calendars ({calendars.length})
                </p>
                <div className="space-y-1">
                  {calendars.map((cal) => (
                    <div
                      key={cal.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      {cal.calendarColor && (
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: cal.calendarColor }}
                        />
                      )}
                      <span className="truncate">{cal.calendarName}</span>
                      <span className="text-muted-foreground ml-auto">
                        {cal.eventCount} events
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
