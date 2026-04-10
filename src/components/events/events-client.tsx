"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  List,
  Calendar,
  Plus,
  MoreVertical,
  Plug,
  Settings,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EventListView } from "./event-list-view";
import { EventCalendarView } from "./event-calendar-view";
import { CreateEventDialog } from "./create-event-dialog";
import { EventSettingsDialog } from "./event-settings-dialog";
import { IntegrateCalendarDialog } from "./integrate-calendar-dialog";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import type { CalendarEventRow, CalendarSyncRow, IntegrationRow } from "./types";

// ─── Types ──────────────────────────────────────────────────────

interface EventsClientProps {
  initialEvents: CalendarEventRow[];
  initialCalendars: CalendarSyncRow[];
  initialIntegrations: IntegrationRow[];
}

// ─── Component ──────────────────────────────────────────────────

export function EventsClient({
  initialEvents,
  initialCalendars,
  initialIntegrations,
}: EventsClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEventRow[]>(initialEvents);
  const [calendars] = useState<CalendarSyncRow[]>(initialCalendars);
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<Set<string>>(
    () => new Set(initialCalendars.map((c) => c.id))
  );

  // Dialog states
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createEventDate, setCreateEventDate] = useState<Date | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [integrateOpen, setIntegrateOpen] = useState(false);

  const handleView = useCallback(
    (event: CalendarEventRow) => {
      router.push(`/admin/blocks/events/${event.id}`);
    },
    [router]
  );

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/events/sync", { method: "POST" });
      if (res.ok) {
        const eventsRes = await fetch("/api/events");
        if (eventsRes.ok) {
          const { data } = await eventsRes.json();
          setEvents(data);
        }
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleToggleCalendar = useCallback((calendarId: string) => {
    setSelectedCalendarIds((prev) => {
      const next = new Set(prev);
      if (next.has(calendarId)) {
        next.delete(calendarId);
      } else {
        next.add(calendarId);
      }
      return next;
    });
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    setCreateEventDate(date);
    setCreateEventOpen(true);
  }, []);

  const handleEventCreated = useCallback(async () => {
    const eventsRes = await fetch("/api/events");
    if (eventsRes.ok) {
      const { data } = await eventsRes.json();
      setEvents(data);
    }
  }, []);

  const filteredEvents = useMemo(() => {
    if (selectedCalendarIds.size === calendars.length) return events;
    return events.filter((e) => selectedCalendarIds.has(e.calendarSyncId));
  }, [events, selectedCalendarIds, calendars.length]);

  return (
    <>
      <PageHeader
        title="Events"
        description="All your calendar events in one place"
        action={
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center rounded-lg border bg-muted/50 p-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-md px-2.5 py-2 transition-colors ${
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`rounded-md px-2.5 py-2 transition-colors ${
                  viewMode === "calendar"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Calendar view"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>

            {/* Add Event */}
            <Button
              size="sm"
              onClick={() => {
                setCreateEventDate(null);
                setCreateEventOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Event
            </Button>

            {/* Options Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="icon-sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIntegrateOpen(true)}
                >
                  <Plug className="h-4 w-4" />
                  Integrate Calendar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (!syncing) handleSync();
                  }}
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Sync Now
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="px-4">
        {viewMode === "list" ? (
          <EventListView events={filteredEvents} onView={handleView} />
        ) : (
          <EventCalendarView
            events={filteredEvents}
            calendars={calendars}
            selectedCalendarIds={selectedCalendarIds}
            onToggleCalendar={handleToggleCalendar}
            onSelectEvent={handleView}
            onDayClick={handleDayClick}
          />
        )}
      </div>

      {/* Dialogs */}
      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        calendars={calendars}
        prefillDate={createEventDate}
        onEventCreated={handleEventCreated}
      />
      <EventSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        calendars={calendars}
        onSync={handleSync}
        syncing={syncing}
      />
      <IntegrateCalendarDialog
        open={integrateOpen}
        onOpenChange={setIntegrateOpen}
        integrations={initialIntegrations}
      />
      <BlockAgentPanel blockName="events" blockDisplayName="Events" />
    </>
  );
}
