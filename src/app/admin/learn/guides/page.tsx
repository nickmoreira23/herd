import { BookMarked, ChevronRight, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

interface Guide {
  title: string;
  read: string;
  level: "Beginner" | "Intermediate" | "Advanced";
}

const sections: Array<{ name: string; tagline: string; guides: Guide[] }> = [
  {
    name: "Form & Technique",
    tagline: "Move better, lift heavier, stay healthy.",
    guides: [
      { title: "How to squat: a step-by-step guide", read: "6 min", level: "Beginner" },
      { title: "Mastering the deadlift setup", read: "8 min", level: "Intermediate" },
      { title: "Bench press: bar path and arch", read: "7 min", level: "Intermediate" },
      { title: "Overhead press without losing your back", read: "5 min", level: "Beginner" },
    ],
  },
  {
    name: "Programming",
    tagline: "Build a plan that actually works.",
    guides: [
      { title: "Push-Pull-Legs vs Upper-Lower split", read: "9 min", level: "Beginner" },
      { title: "Periodization made simple", read: "12 min", level: "Intermediate" },
      { title: "Progressive overload without overtraining", read: "7 min", level: "Beginner" },
    ],
  },
  {
    name: "Nutrition Basics",
    tagline: "Fuel like an athlete.",
    guides: [
      { title: "Calculating your daily calorie needs", read: "8 min", level: "Beginner" },
      { title: "Protein 101: how much, when, and from where", read: "10 min", level: "Beginner" },
      { title: "Cutting vs bulking: which one's right for you", read: "11 min", level: "Intermediate" },
    ],
  },
];

const levelColor: Record<Guide["level"], string> = {
  Beginner: "bg-emerald-100 text-emerald-700",
  Intermediate: "bg-amber-100 text-amber-700",
  Advanced: "bg-rose-100 text-rose-700",
};

export default function GuidesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Learn", href: "/admin/learn" }]}
        title="Guides"
        description="Short, focused how-tos written by coaches and dietitians."
      />

      {sections.map((section) => (
        <section
          key={section.name}
          className="rounded-xl border bg-card overflow-hidden"
        >
          <header className="px-6 py-4 border-b flex items-start gap-3">
            <span
              className="h-10 w-10 shrink-0 rounded-lg bg-white ring-1 ring-border flex items-center justify-center mt-0.5"
              style={{ color: "#e22627" }}
            >
              <BookMarked className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">{section.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {section.tagline}
              </p>
            </div>
          </header>
          <ul className="divide-y divide-border">
            {section.guides.map((g, i) => (
              <li
                key={i}
                className="flex items-center gap-4 px-6 py-3 hover:bg-accent/30 cursor-pointer"
              >
                <p className="flex-1 text-sm font-medium leading-tight">
                  {g.title}
                </p>
                <Badge
                  variant="secondary"
                  className={`shrink-0 text-[10px] ${levelColor[g.level]}`}
                >
                  {g.level}
                </Badge>
                <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {g.read}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
