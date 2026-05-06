import { ChefHat, Timer, Flame } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

const recipes = [
  { title: "High-Protein Pancakes", goal: "Build", time: "15 min", calories: 410, protein: 38 },
  { title: "Chicken Quinoa Bowl", goal: "Maintain", time: "25 min", calories: 540, protein: 45 },
  { title: "Salmon Rice Plate", goal: "Build", time: "20 min", calories: 620, protein: 42 },
  { title: "Veggie Tofu Stir-Fry", goal: "Lean", time: "20 min", calories: 380, protein: 28 },
  { title: "Overnight Oats Jar", goal: "Build", time: "5 min", calories: 460, protein: 30 },
  { title: "Turkey Lettuce Wraps", goal: "Lean", time: "15 min", calories: 320, protein: 36 },
  { title: "Egg White Omelet", goal: "Lean", time: "10 min", calories: 260, protein: 32 },
  { title: "Greek Yogurt Parfait", goal: "Maintain", time: "5 min", calories: 280, protein: 22 },
];

const goalColor: Record<string, string> = {
  Build: "#e22627",
  Maintain: "#3b82f6",
  Lean: "#10b981",
};

export default function RecipesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Nutrition", href: "/admin/spaces/nutrition" }]}
        title="Recipes"
        description="Quick, macro-friendly recipes built around your plan."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((r, i) => (
          <article
            key={i}
            className="rounded-xl border bg-card overflow-hidden hover:shadow-sm transition-shadow"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-muted to-foreground/5 flex items-center justify-center">
              <ChefHat
                className="h-10 w-10 opacity-30"
                style={{ color: goalColor[r.goal] ?? "#6b7280" }}
              />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-tight">
                  {r.title}
                </h3>
                <Badge
                  variant="secondary"
                  className="shrink-0 text-[10px]"
                  style={{
                    backgroundColor: `${goalColor[r.goal] ?? "#6b7280"}1A`,
                    color: goalColor[r.goal] ?? "#6b7280",
                  }}
                >
                  {r.goal}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {r.time}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {r.calories} kcal
                </span>
                <span>P {r.protein}g</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
