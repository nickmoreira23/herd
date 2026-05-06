import { PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

const videos = [
  { title: "5 mistakes you're making with the squat", duration: "6:42", category: "Form", color: "#e22627" },
  { title: "Build your first home gym for $500", duration: "11:08", category: "Gear", color: "#3b82f6" },
  { title: "3 protein hacks for busy days", duration: "4:55", category: "Nutrition", color: "#10b981" },
  { title: "Why mobility beats stretching", duration: "8:21", category: "Recovery", color: "#8b5cf6" },
  { title: "Mind-muscle connection — for real", duration: "7:30", category: "Form", color: "#e22627" },
  { title: "Dialing in your warm-up", duration: "5:14", category: "Training", color: "#f59e0b" },
  { title: "How much sleep do lifters actually need?", duration: "9:45", category: "Recovery", color: "#8b5cf6" },
  { title: "Cutting without losing strength", duration: "12:02", category: "Nutrition", color: "#10b981" },
  { title: "Mental reps: visualization for PRs", duration: "6:17", category: "Mindset", color: "#ef4444" },
];

const filters = ["All", "Form", "Training", "Nutrition", "Recovery", "Mindset"];

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Learn", href: "/admin/learn" }]}
        title="Videos"
        description="Bite-sized video lessons from the HERD coaching team."
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f, i) => (
          <button
            key={f}
            className={
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors " +
              (i === 0
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground")
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((v, i) => (
          <article
            key={i}
            className="rounded-xl border bg-card overflow-hidden hover:shadow-sm transition-shadow group cursor-pointer"
          >
            <div
              className="aspect-[16/9] flex items-center justify-center relative"
              style={{ backgroundColor: `${v.color}1A` }}
            >
              <PlayCircle
                className="h-14 w-14 transition-transform group-hover:scale-110"
                style={{ color: v.color }}
                strokeWidth={1.5}
              />
              <Badge
                variant="secondary"
                className="absolute bottom-2 right-2 text-[10px] tabular-nums bg-black/80 text-white"
              >
                {v.duration}
              </Badge>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-semibold leading-tight line-clamp-2">
                {v.title}
              </h3>
              <Badge
                variant="secondary"
                className="text-[10px]"
                style={{
                  backgroundColor: `${v.color}1A`,
                  color: v.color,
                }}
              >
                {v.category}
              </Badge>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
