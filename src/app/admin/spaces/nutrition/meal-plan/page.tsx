import {
  UtensilsCrossed,
  Sun,
  Coffee,
  Cookie,
  Moon as MoonIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const meals = [
  {
    slot: "Breakfast",
    icon: Coffee,
    time: "7:30 AM",
    title: "Protein oats with berries & almonds",
    calories: 480,
    protein: 32,
    carbs: 58,
    fat: 14,
  },
  {
    slot: "Lunch",
    icon: Sun,
    time: "12:30 PM",
    title: "Grilled chicken bowl, quinoa, avocado",
    calories: 620,
    protein: 48,
    carbs: 55,
    fat: 22,
  },
  {
    slot: "Snack",
    icon: Cookie,
    time: "4:00 PM",
    title: "Greek yogurt + whey scoop",
    calories: 230,
    protein: 32,
    carbs: 18,
    fat: 4,
  },
  {
    slot: "Dinner",
    icon: MoonIcon,
    time: "7:30 PM",
    title: "Salmon, sweet potato, roasted broccoli",
    calories: 580,
    protein: 42,
    carbs: 48,
    fat: 22,
  },
];

const totals = meals.reduce(
  (acc, m) => ({
    calories: acc.calories + m.calories,
    protein: acc.protein + m.protein,
    carbs: acc.carbs + m.carbs,
    fat: acc.fat + m.fat,
  }),
  { calories: 0, protein: 0, carbs: 0, fat: 0 },
);

const target = { calories: 2200, protein: 165, carbs: 220, fat: 65 };

export default function MealPlanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Nutrition", href: "/admin/spaces/nutrition" }]}
        title="Meal Plan"
        description="Your meals for today, dialed in to your goals."
      />

      {/* Totals */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Today's targets</h2>
          <Badge variant="secondary">
            {totals.calories} / {target.calories} kcal
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Macro label="Calories" value={totals.calories} target={target.calories} unit="kcal" color="#e22627" />
          <Macro label="Protein" value={totals.protein} target={target.protein} unit="g" color="#3b82f6" />
          <Macro label="Carbs" value={totals.carbs} target={target.carbs} unit="g" color="#f59e0b" />
          <Macro label="Fat" value={totals.fat} target={target.fat} unit="g" color="#10b981" />
        </div>
      </section>

      {/* Meals */}
      <section className="rounded-xl border bg-card overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center gap-3">
          <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Meals</h2>
        </header>
        <ul className="divide-y divide-border">
          {meals.map((m, i) => {
            const Icon = m.icon;
            return (
              <li key={i} className="flex items-center gap-4 px-6 py-4">
                <span
                  className="h-12 w-12 shrink-0 rounded-xl bg-white ring-1 ring-border flex items-center justify-center"
                  style={{ color: "#e22627" }}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                      {m.slot}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {m.time}
                    </p>
                  </div>
                  <p className="text-sm font-medium leading-tight mt-0.5">
                    {m.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                    P {m.protein}g · C {m.carbs}g · F {m.fat}g
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {m.calories} kcal
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Macro({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </p>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {value} / {target} {unit}
        </p>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all")}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
