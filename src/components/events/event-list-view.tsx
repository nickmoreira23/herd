"use client";

import { DataTable } from "@/components/ui/data-table";
import { getEventColumns } from "./event-columns";
import type { CalendarEventRow } from "./types";

interface EventListViewProps {
  events: CalendarEventRow[];
  onView: (event: CalendarEventRow) => void;
}

export function EventListView({ events, onView }: EventListViewProps) {
  const columns = getEventColumns({ onView });

  return (
    <DataTable
      data={events}
      columns={columns}
      searchable
      searchPlaceholder="Search events..."
      emptyMessage="No events found. Connect a calendar and sync to see your events here."
      onRowClick={onView}
    />
  );
}
