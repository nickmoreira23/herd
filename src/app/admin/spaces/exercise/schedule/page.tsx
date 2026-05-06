import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

const week = [
  { day: "Mon", date: "May 5", workout: "Push Day", duration: "45 min", color: "#e22627" },
  { day: "Tue", date: "May 6", workout: "Pull Day", duration: "50 min", color: "#e22627" },
  { day: "Wed", date: "May 7", workout: "Mobility", duration: "20 min", color: "#6b7280" },
  { day: "Thu", date: "May 8", workout: "Legs", duration: "55 min", color: "#e22627" },
  { day: "Fri", date: "May 9", workout: "Upper Pump", duration: "40 min", color: "#e22627" },
  { day: "Sat", date: "May 10", workout: "Cardio", duration: "30 min", color: "#3b82f6" },
  { day: "Sun", date: "May 11", workout: "Rest", duration: "—", color: "#9ca3af", rest: true },
];

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Exercise", href: "/admin/spaces/exercise" }]}
        title="Schedule"
        description="Your training week at a glance."
      />

      <section className="rounded-xl border bg-card overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center gap-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Week of May 5 — May 11</h2>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {week.map((d) => (
            <div
              key={d.day}
              className={cn(
                "p-4 flex flex-col gap-2 min-h-[140px]",
                d.rest && "bg-muted/30",
              )}
            >
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {d.day}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {d.date}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-md p-2.5 mt-auto text-white",
                  d.rest && "bg-muted text-muted-foreground",
                )}
                style={d.rest ? undefined : { backgroundColor: d.color }}
              >
                <p className="text-sm font-semibold leading-tight">
                  {d.workout}
                </p>
                <p className="text-[11px] opacity-80 tabular-nums mt-0.5">
                  {d.duration}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold mb-3">Legend</h2>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: "#e22627" }} />
            Strength
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: "#3b82f6" }} />
            Cardio
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: "#6b7280" }} />
            Mobility
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-muted" />
            Rest
          </div>
        </div>
      </section>
    </div>
  );
}
