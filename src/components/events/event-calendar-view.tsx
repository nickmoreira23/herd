"use client";

import { useState, useMemo, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  differenceInMinutes,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCalendarFilter } from "./event-calendar-filter";
import type { CalendarEventRow, CalendarSyncRow } from "./types";

// ─── Types & Constants ──────────────────────────────────────────

type CalendarViewMode = "day" | "week" | "month";

interface EventCalendarViewProps {
  events: CalendarEventRow[];
  calendars: CalendarSyncRow[];
  selectedCalendarIds: Set<string>;
  onToggleCalendar: (calendarId: string) => void;
  onSelectEvent: (event: CalendarEventRow) => void;
  onDayClick: (date: Date) => void;
}

const HOUR_HEIGHT = 60;
const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

// ─── Helpers ────────────────────────────────────────────────────

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function getEventsForDay(
  events: CalendarEventRow[],
  day: Date
): CalendarEventRow[] {
  const ds = startOfDay(day);
  const de = endOfDay(day);
  return events.filter((event) => {
    const es = new Date(event.startAt);
    const ee = new Date(event.endAt);
    return es <= de && ee >= ds;
  });
}

function getEventPosition(event: CalendarEventRow, dayDate: Date) {
  const eventStart = new Date(event.startAt);
  const eventEnd = new Date(event.endAt);

  const dayStart = new Date(dayDate);
  dayStart.setHours(START_HOUR, 0, 0, 0);
  const dayEnd = new Date(dayDate);
  dayEnd.setHours(END_HOUR, 0, 0, 0);

  const visibleStart = eventStart < dayStart ? dayStart : eventStart;
  const visibleEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

  const startMinutes =
    (visibleStart.getHours() - START_HOUR) * 60 + visibleStart.getMinutes();
  const durationMinutes = differenceInMinutes(visibleEnd, visibleStart);

  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20);

  return { top, height };
}

function layoutTimeEvents(dayEvents: CalendarEventRow[]) {
  const layout = new Map<
    string,
    { column: number; totalColumns: number }
  >();
  if (dayEvents.length === 0) return layout;

  const sorted = [...dayEvents].sort((a, b) => {
    const diff =
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
    if (diff !== 0) return diff;
    return (
      new Date(b.endAt).getTime() -
      new Date(b.startAt).getTime() -
      (new Date(a.endAt).getTime() - new Date(a.startAt).getTime())
    );
  });

  const columns: CalendarEventRow[][] = [];
  for (const event of sorted) {
    const eventStart = new Date(event.startAt).getTime();
    let placed = false;
    for (const col of columns) {
      const last = col[col.length - 1];
      if (new Date(last.endAt).getTime() <= eventStart) {
        col.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) columns.push([event]);
  }

  const totalColumns = columns.length || 1;
  for (let ci = 0; ci < columns.length; ci++) {
    for (const event of columns[ci]) {
      layout.set(event.id, { column: ci, totalColumns });
    }
  }
  return layout;
}

// ─── Main Component ─────────────────────────────────────────────

export function EventCalendarView({
  events,
  calendars,
  selectedCalendarIds,
  onToggleCalendar,
  onSelectEvent,
  onDayClick,
}: EventCalendarViewProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigate = useCallback(
    (direction: "prev" | "next") => {
      setCurrentDate((prev) => {
        switch (viewMode) {
          case "month":
            return direction === "prev"
              ? subMonths(prev, 1)
              : addMonths(prev, 1);
          case "week":
            return direction === "prev"
              ? subWeeks(prev, 1)
              : addWeeks(prev, 1);
          case "day":
            return direction === "prev"
              ? subDays(prev, 1)
              : addDays(prev, 1);
        }
      });
    },
    [viewMode]
  );

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);

  const headerTitle = useMemo(() => {
    switch (viewMode) {
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "week": {
        const ws = startOfWeek(currentDate);
        const we = endOfWeek(currentDate);
        return ws.getMonth() === we.getMonth()
          ? `${format(ws, "MMM d")} – ${format(we, "d, yyyy")}`
          : `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
      }
      case "day":
        return format(currentDate, "EEEE, MMMM d, yyyy");
    }
  }, [currentDate, viewMode]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => navigate("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => navigate("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold">{headerTitle}</h2>
        </div>
        <div className="flex items-center gap-2">
          <EventCalendarFilter
            calendars={calendars}
            selectedCalendarIds={selectedCalendarIds}
            onToggle={onToggleCalendar}
          />
          <div className="flex items-center rounded-lg border bg-muted/50 p-1 shrink-0">
            {(["day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 min-h-0">
        {viewMode === "month" && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onSelectEvent={onSelectEvent}
            onDayClick={onDayClick}
          />
        )}
        {viewMode === "week" && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onSelectEvent={onSelectEvent}
            onDayClick={onDayClick}
          />
        )}
        {viewMode === "day" && (
          <DayView
            currentDate={currentDate}
            events={events}
            onSelectEvent={onSelectEvent}
            onDayClick={onDayClick}
          />
        )}
      </div>
    </div>
  );
}

// ─── Month View ─────────────────────────────────────────────────

interface SubViewProps {
  currentDate: Date;
  events: CalendarEventRow[];
  onSelectEvent: (event: CalendarEventRow) => void;
  onDayClick: (date: Date) => void;
}

function MonthView({
  currentDate,
  events,
  onSelectEvent,
  onDayClick,
}: SubViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const numWeeks = Math.ceil(days.length / 7);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventRow[]>();
    for (const event of events) {
      const es = startOfDay(new Date(event.startAt));
      const ee = endOfDay(new Date(event.endAt));
      for (const day of days) {
        const ds = startOfDay(day);
        const de = endOfDay(day);
        if (es <= de && ee >= ds) {
          const key = format(day, "yyyy-MM-dd");
          const existing = map.get(key) || [];
          if (!existing.some((e) => e.id === event.id)) {
            existing.push(event);
            map.set(key, existing);
          }
        }
      }
    }
    return map;
  }, [events, days]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30 shrink-0">
        {weekDays.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-xs font-medium text-muted-foreground text-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells grid — fills remaining space */}
      <div
        className="flex-1 grid grid-cols-7"
        style={{ gridTemplateRows: `repeat(${numWeeks}, 1fr)` }}
      >
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) || [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const maxVisible = 3;
          const overflowCount = Math.max(0, dayEvents.length - maxVisible);

          return (
            <div
              key={key}
              className={`border-b border-r border-border p-1 overflow-hidden cursor-pointer hover:bg-muted/20 transition-colors ${
                !inMonth ? "bg-muted/20" : ""
              }`}
              onClick={() => {
                const d = new Date(day);
                d.setHours(9, 0, 0, 0);
                onDayClick(d);
              }}
            >
              {/* Day number */}
              <div className="flex justify-end mb-0.5">
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    today
                      ? "bg-primary text-primary-foreground"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, maxVisible).map((event) => (
                  <button
                    key={event.id}
                    className="w-full text-left px-1 py-0.5 rounded text-[11px] leading-tight truncate hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor:
                        (event.calendarSync.calendarColor || "#3b82f6") + "20",
                      color: event.calendarSync.calendarColor || "#3b82f6",
                      borderLeft: `2px solid ${event.calendarSync.calendarColor || "#3b82f6"}`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(event);
                    }}
                    title={event.title}
                  >
                    {event.isAllDay
                      ? event.title
                      : `${format(new Date(event.startAt), "h:mm a")} ${event.title}`}
                  </button>
                ))}
                {overflowCount > 0 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{overflowCount} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ──────────────────────────────────────────────────

function WeekView({
  currentDate,
  events,
  onSelectEvent,
  onDayClick,
}: SubViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex shrink-0 border-b border-border">
        <div className="w-16 shrink-0 border-r border-border" />
        <div className="flex-1 grid grid-cols-7">
          {days.map((day) => {
            const today = isToday(day);
            return (
              <div
                key={format(day, "yyyy-MM-dd")}
                className="border-r border-border p-2 text-center"
              >
                <div className="text-[11px] font-medium text-muted-foreground uppercase">
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-sm font-semibold mt-0.5 ${
                    today
                      ? "bg-primary text-primary-foreground rounded-full w-7 h-7 mx-auto flex items-center justify-center"
                      : ""
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="flex"
          style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
        >
          {/* Time gutter */}
          <div className="w-16 shrink-0 border-r border-border">
            {HOURS.map((hour) => (
              <div
                key={hour}
                style={{ height: HOUR_HEIGHT }}
                className="relative"
              >
                <span className="absolute -top-2.5 right-2 text-[11px] text-muted-foreground">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex-1 grid grid-cols-7">
            {days.map((day) => {
              const dayEvents = getEventsForDay(events, day);
              const timedEvents = dayEvents.filter((e) => !e.isAllDay);
              const layoutMap = layoutTimeEvents(timedEvents);

              return (
                <div
                  key={format(day, "yyyy-MM-dd")}
                  className="border-r border-border relative"
                >
                  {/* Hour gridlines */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      style={{ height: HOUR_HEIGHT }}
                      className="border-b border-border/50 cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => {
                        const d = new Date(day);
                        d.setHours(hour, 0, 0, 0);
                        onDayClick(d);
                      }}
                    />
                  ))}

                  {/* Events */}
                  {timedEvents.map((event) => {
                    const pos = getEventPosition(event, day);
                    const lyt = layoutMap.get(event.id);
                    const totalCols = lyt?.totalColumns || 1;
                    const col = lyt?.column || 0;

                    return (
                      <button
                        key={event.id}
                        className="absolute rounded px-1 py-0.5 text-[11px] leading-tight overflow-hidden hover:opacity-90 transition-opacity z-10"
                        style={{
                          top: pos.top,
                          height: pos.height,
                          left: `calc(${(col / totalCols) * 100}% + 2px)`,
                          width: `calc(${(1 / totalCols) * 100}% - 4px)`,
                          backgroundColor:
                            (event.calendarSync.calendarColor || "#3b82f6") +
                            "25",
                          borderLeft: `3px solid ${event.calendarSync.calendarColor || "#3b82f6"}`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(event);
                        }}
                        title={event.title}
                      >
                        <div
                          className="font-medium truncate"
                          style={{
                            color:
                              event.calendarSync.calendarColor || "#3b82f6",
                          }}
                        >
                          {event.title}
                        </div>
                        {pos.height > 30 && (
                          <div className="text-muted-foreground truncate">
                            {format(new Date(event.startAt), "h:mm a")}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Day View ───────────────────────────────────────────────────

function DayView({
  currentDate,
  events,
  onSelectEvent,
  onDayClick,
}: SubViewProps) {
  const dayEvents = useMemo(
    () => getEventsForDay(events, currentDate),
    [events, currentDate]
  );
  const allDayEvents = dayEvents.filter((e) => e.isAllDay);
  const timedEvents = dayEvents.filter((e) => !e.isAllDay);
  const layoutMap = layoutTimeEvents(timedEvents);

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden">
      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="shrink-0 border-b border-border p-2 bg-muted/20">
          <div className="text-[11px] font-medium text-muted-foreground mb-1">
            All Day
          </div>
          <div className="flex flex-wrap gap-1">
            {allDayEvents.map((event) => (
              <button
                key={event.id}
                className="px-2 py-1 rounded text-xs font-medium truncate max-w-xs hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor:
                    (event.calendarSync.calendarColor || "#3b82f6") + "20",
                  color: event.calendarSync.calendarColor || "#3b82f6",
                }}
                onClick={() => onSelectEvent(event)}
              >
                {event.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
          {/* Time gutter */}
          <div className="w-20 shrink-0 border-r border-border">
            {HOURS.map((hour) => (
              <div
                key={hour}
                style={{ height: HOUR_HEIGHT }}
                className="relative"
              >
                <span className="absolute -top-2.5 right-3 text-[11px] text-muted-foreground">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Single day column */}
          <div className="flex-1 relative">
            {/* Hour gridlines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                style={{ height: HOUR_HEIGHT }}
                className="border-b border-border/50 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setHours(hour, 0, 0, 0);
                  onDayClick(d);
                }}
              />
            ))}

            {/* Events */}
            {timedEvents.map((event) => {
              const pos = getEventPosition(event, currentDate);
              const lyt = layoutMap.get(event.id);
              const totalCols = lyt?.totalColumns || 1;
              const col = lyt?.column || 0;

              return (
                <button
                  key={event.id}
                  className="absolute rounded-md px-2 py-1 text-xs leading-tight overflow-hidden hover:opacity-90 transition-opacity z-10"
                  style={{
                    top: pos.top,
                    height: pos.height,
                    left: `calc(${(col / totalCols) * 100}% + 4px)`,
                    width: `calc(${(1 / totalCols) * 100}% - 8px)`,
                    backgroundColor:
                      (event.calendarSync.calendarColor || "#3b82f6") + "20",
                    borderLeft: `3px solid ${event.calendarSync.calendarColor || "#3b82f6"}`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(event);
                  }}
                  title={event.title}
                >
                  <div
                    className="font-medium truncate"
                    style={{
                      color: event.calendarSync.calendarColor || "#3b82f6",
                    }}
                  >
                    {event.title}
                  </div>
                  {pos.height > 30 && (
                    <div className="text-muted-foreground">
                      {format(new Date(event.startAt), "h:mm a")} –{" "}
                      {format(new Date(event.endAt), "h:mm a")}
                    </div>
                  )}
                  {pos.height > 50 && event.location && (
                    <div className="text-muted-foreground truncate mt-0.5">
                      {event.location}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
