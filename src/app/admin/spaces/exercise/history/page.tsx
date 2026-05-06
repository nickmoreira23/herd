import { History as HistoryIcon, Flame, Timer, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

const sessions = [
  { date: "May 4", title: "Push Day", duration: "47 min", volume: "12,400 lb", calories: 412 },
  { date: "May 3", title: "Pull Day", duration: "52 min", volume: "11,800 lb", calories: 438 },
  { date: "May 2", title: "Mobility", duration: "22 min", volume: "—", calories: 105 },
  { date: "May 1", title: "Leg Day", duration: "58 min", volume: "18,200 lb", calories: 521 },
  { date: "Apr 30", title: "Upper Pump", duration: "41 min", volume: "9,600 lb", calories: 378 },
  { date: "Apr 29", title: "Cardio", duration: "32 min", volume: "—", calories: 296 },
  { date: "Apr 28", title: "Push Day", duration: "45 min", volume: "11,950 lb", calories: 405 },
  { date: "Apr 26", title: "Pull Day", duration: "49 min", volume: "11,400 lb", calories: 422 },
];

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Exercise", href: "/admin/spaces/exercise" }]}
        title="History"
        description="Every session you've completed in the last 30 days."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={HistoryIcon} label="Sessions" value="22" sub="Last 30 days" />
        <Stat icon={Timer} label="Total time" value="16h 42m" sub="Avg 46 min/session" />
        <Stat icon={Flame} label="Calories" value="9,124" sub="Across all sessions" />
        <Stat icon={TrendingUp} label="Volume" value="284K lb" sub="Total lifted" />
      </div>

      <section className="rounded-xl border bg-card overflow-hidden">
        <header className="px-6 py-4 border-b">
          <h2 className="text-base font-semibold">Recent sessions</h2>
        </header>
        <ul className="divide-y divide-border">
          {sessions.map((s, i) => (
            <li
              key={i}
              className="flex items-center gap-4 px-6 py-3 hover:bg-accent/30"
            >
              <span className="text-xs text-muted-foreground w-16 shrink-0 uppercase tracking-wider font-medium tabular-nums">
                {s.date}
              </span>
              <p className="flex-1 text-sm font-medium">{s.title}</p>
              <Badge variant="secondary" className="gap-1">
                <Timer className="h-3 w-3" />
                {s.duration}
              </Badge>
              <span className="text-xs text-muted-foreground tabular-nums w-24 text-right">
                {s.volume}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                {s.calories} kcal
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof HistoryIcon;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 flex items-start gap-3">
      <span
        className="h-10 w-10 shrink-0 rounded-lg bg-white ring-1 ring-border flex items-center justify-center"
        style={{ color: "#e22627" }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </p>
        <p className="text-xl font-bold tracking-tight tabular-nums mt-0.5">
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
