import { GraduationCap, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const courses = [
  { title: "Hypertrophy Foundations", level: "Intermediate", lessons: 14, duration: "4h 10m", progress: 0, color: "#e22627" },
  { title: "Mobility & Recovery", level: "All levels", lessons: 8, duration: "2h", progress: 60, color: "#3b82f6" },
  { title: "Nutrition for Performance", level: "Intermediate", lessons: 10, duration: "3h 5m", progress: 100, color: "#10b981" },
  { title: "Cardio That Doesn't Suck", level: "All levels", lessons: 6, duration: "1h 30m", progress: 0, color: "#f59e0b" },
  { title: "Mind & Mindset", level: "Beginner", lessons: 9, duration: "2h 45m", progress: 22, color: "#8b5cf6" },
  { title: "Powerlifting Essentials", level: "Advanced", lessons: 16, duration: "5h 10m", progress: 0, color: "#ef4444" },
];

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Learn", href: "/admin/learn" }]}
        title="Courses"
        description="Structured, multi-lesson programs taught by HERD coaches."
      />

      <section>
        <header className="mb-3">
          <h2 className="text-base font-semibold">All courses</h2>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c, i) => (
            <article
              key={i}
              className="rounded-xl border bg-card overflow-hidden hover:shadow-sm transition-shadow"
            >
              <div
                className="aspect-[16/9] flex items-center justify-center"
                style={{ backgroundColor: `${c.color}1A` }}
              >
                <GraduationCap
                  className="h-10 w-10"
                  style={{ color: c.color }}
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-tight">
                    {c.title}
                  </h3>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {c.level}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
                  <span>{c.lessons} lessons</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {c.duration}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      {c.progress === 0
                        ? "Not started"
                        : c.progress === 100
                          ? "Completed"
                          : `${c.progress}% complete`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        c.progress === 100 ? "bg-emerald-500" : "",
                      )}
                      style={
                        c.progress === 100
                          ? { width: "100%" }
                          : { width: `${c.progress}%`, backgroundColor: c.color }
                      }
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
