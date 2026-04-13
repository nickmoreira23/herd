"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MoreVertical,
  Plug,
  Settings,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlockListPage } from "@/components/shared/block-list-page";
import { getEventColumns } from "./event-columns";
import { EventCalendarView } from "./event-calendar-view";
import { CreateEventDialog } from "./create-event-dialog";
import { EventSettingsDialog } from "./event-settings-dialog";
import { IntegrateCalendarDialog } from "./integrate-calendar-dialog";
import { EventCalendarFilter } from "./event-calendar-filter";
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

  const columns = useMemo(
    () => getEventColumns({ onView: handleView }),
    [handleView]
  );

  return (
    <BlockListPage<CalendarEventRow>
      blockName="events"
      title="Events"
      description="All your calendar events in one place"
      data={filteredEvents}
      getId={(e) => e.id}
      columns={columns}
      onRowClick={handleView}
      searchPlaceholder="Search events..."
      searchFn={(item, query) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          (item.description?.toLowerCase().includes(q) ?? false)
        );
      }}
      toolbarExtras={
        <EventCalendarFilter
          calendars={calendars}
          selectedCalendarIds={selectedCalendarIds}
          onToggle={handleToggleCalendar}
        />
      }
      additionalViews={[
        {
          type: "calendar" as const,
          render: (data) => (
            <EventCalendarView
              events={data}
              calendars={calendars}
              selectedCalendarIds={selectedCalendarIds}
              onToggleCalendar={handleToggleCalendar}
              onSelectEvent={handleView}
              onDayClick={handleDayClick}
            />
          ),
        },
      ]}
      headerActions={
        <div className="flex items-center gap-2">
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

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="icon-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIntegrateOpen(true)}>
                <Plug className="h-4 w-4" />
                Integrate Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
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
      modals={
        <>
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
        </>
      }
      showAgent={true}
    />
  );
}
