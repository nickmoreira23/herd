"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";
import type { CalendarSyncRow } from "./types";

interface EventCalendarFilterProps {
  calendars: CalendarSyncRow[];
  selectedCalendarIds: Set<string>;
  onToggle: (calendarId: string) => void;
}

export function EventCalendarFilter({
  calendars,
  selectedCalendarIds,
  onToggle,
}: EventCalendarFilterProps) {
  if (calendars.length === 0) return null;

  const activeCount = selectedCalendarIds.size;
  const totalCount = calendars.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Calendars
            {activeCount < totalCount && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({activeCount}/{totalCount})
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2 space-y-1">
          {calendars.map((cal) => {
            const isSelected = selectedCalendarIds.has(cal.id);
            return (
              <button
                key={cal.id}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                onClick={() => onToggle(cal.id)}
              >
                <span
                  className={`h-3 w-3 rounded-sm border shrink-0 flex items-center justify-center ${
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="h-2 w-2 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                {cal.calendarColor && (
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cal.calendarColor }}
                  />
                )}
                <span className="truncate">{cal.calendarName}</span>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
