import { Newspaper, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

const featured = {
  title: "The science of muscle growth (in plain English)",
  excerpt:
    "Why progressive overload, mechanical tension, and protein matter — and how to actually use them in your training.",
  topic: "Training",
  read: "12 min",
  author: "Coach Jamie",
};

const articles = [
  { title: "5 sleep habits that boost recovery", topic: "Recovery", read: "6 min", author: "Dr. Patel", date: "May 3" },
  { title: "Carb cycling: hype or actually useful?", topic: "Nutrition", read: "9 min", author: "Coach Lin", date: "May 2" },
  { title: "Mental warm-ups before a heavy lift", topic: "Mindset", read: "5 min", author: "Coach Marcus", date: "Apr 30" },
  { title: "Why your warm-up is sabotaging your sets", topic: "Training", read: "7 min", author: "Dr. Patel", date: "Apr 29" },
  { title: "Reading nutrition labels without the BS", topic: "Nutrition", read: "8 min", author: "Coach Lin", date: "Apr 27" },
  { title: "The RPE scale: train smarter, not just harder", topic: "Training", read: "6 min", author: "Coach Jamie", date: "Apr 25" },
];

const topicColor: Record<string, string> = {
  Training: "bg-rose-100 text-rose-700",
  Nutrition: "bg-emerald-100 text-emerald-700",
  Recovery: "bg-blue-100 text-blue-700",
  Mindset: "bg-violet-100 text-violet-700",
};

export default function ArticlesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Learn", href: "/admin/learn" }]}
        title="Articles"
        description="Fresh reads from HERD coaches, dietitians, and sports docs."
      />

      {/* Featured */}
      <section className="rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-700 flex items-center justify-center p-8 min-h-[180px]">
            <Newspaper className="h-16 w-16 text-white/90" />
          </div>
          <div className="p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`text-[10px] ${topicColor[featured.topic]}`}
              >
                {featured.topic}
              </Badge>
              <span className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {featured.read}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight leading-tight">
              {featured.title}
            </h2>
            <p className="text-sm text-muted-foreground">{featured.excerpt}</p>
            <p className="text-[11px] text-muted-foreground mt-auto">
              By {featured.author} · Featured this week
            </p>
          </div>
        </div>
      </section>

      {/* Recent */}
      <section className="rounded-xl border bg-card overflow-hidden">
        <header className="px-6 py-4 border-b">
          <h2 className="text-base font-semibold">Recent articles</h2>
        </header>
        <ul className="divide-y divide-border">
          {articles.map((a, i) => (
            <li
              key={i}
              className="flex items-center gap-4 px-6 py-4 hover:bg-accent/30 cursor-pointer"
            >
              <span
                className="h-10 w-10 shrink-0 rounded-lg bg-white ring-1 ring-border flex items-center justify-center"
                style={{ color: "#e22627" }}
              >
                <Newspaper className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">{a.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  By {a.author} · {a.date}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={`shrink-0 text-[10px] ${topicColor[a.topic]}`}
              >
                {a.topic}
              </Badge>
              <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums flex items-center gap-1 w-14">
                <Clock className="h-3 w-3" />
                {a.read}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
