import { Dumbbell, Flame, Timer, Play } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const today = {
  title: "Push Day — Chest & Triceps",
  duration: "45 min",
  difficulty: "Intermediate",
  exercises: [
    { name: "Barbell Bench Press", sets: "4 × 8", rest: "90s" },
    { name: "Incline Dumbbell Press", sets: "4 × 10", rest: "75s" },
    { name: "Cable Fly", sets: "3 × 12", rest: "60s" },
    { name: "Tricep Pushdown", sets: "4 × 12", rest: "45s" },
    { name: "Overhead Tricep Extension", sets: "3 × 12", rest: "45s" },
  ],
};

const upcoming = [
  { day: "Tomorrow", title: "Pull Day — Back & Biceps", duration: "50 min" },
  { day: "Wednesday", title: "Rest / Mobility", duration: "20 min" },
  { day: "Thursday", title: "Leg Day — Quads & Glutes", duration: "55 min" },
  { day: "Friday", title: "Upper Body Pump", duration: "40 min" },
];

export default function WorkoutsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Exercise", href: "/admin/spaces/exercise" }]}
        title="Workouts"
        description="Your training plan, ready to go."
      />

      {/* Today's workout */}
      <section className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-5 bg-black text-white">
          <span
            className="h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "#e22627" }}
          >
            <Dumbbell className="h-7 w-7 text-white" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/70 uppercase tracking-wider">Today</p>
            <h2 className="text-lg font-bold tracking-tight">{today.title}</h2>
          </div>
          <Button className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90">
            <Play className="h-4 w-4 mr-1.5" />
            Start workout
          </Button>
        </div>
        <div className="px-6 py-4 flex items-center gap-3 border-b">
          <Badge variant="secondary" className="gap-1">
            <Timer className="h-3 w-3" />
            {today.duration}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Flame className="h-3 w-3" />
            {today.difficulty}
          </Badge>
          <Badge variant="secondary">{today.exercises.length} exercises</Badge>
        </div>
        <ul className="divide-y divide-border">
          {today.exercises.map((ex, i) => (
            <li key={i} className="flex items-center gap-4 px-6 py-3">
              <span className="h-8 w-8 shrink-0 rounded-md bg-foreground/5 flex items-center justify-center text-xs font-bold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <p className="flex-1 text-sm font-medium">{ex.name}</p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {ex.sets}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                {ex.rest}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Upcoming */}
      <section className="rounded-xl border bg-card">
        <header className="px-6 py-4 border-b">
          <h2 className="text-base font-semibold">This week</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your training plan for the next few days.
          </p>
        </header>
        <ul className="divide-y divide-border">
          {upcoming.map((u, i) => (
            <li
              key={i}
              className="flex items-center gap-4 px-6 py-4 hover:bg-accent/30"
            >
              <span className="text-xs text-muted-foreground w-24 shrink-0 uppercase tracking-wider font-medium">
                {u.day}
              </span>
              <p className="flex-1 text-sm font-medium">{u.title}</p>
              <Badge variant="secondary" className="gap-1">
                <Timer className="h-3 w-3" />
                {u.duration}
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
