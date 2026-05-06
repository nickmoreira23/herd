import { ListChecks, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

const log = [
  {
    date: "Today",
    entries: [
      { time: "7:32 AM", name: "Protein oats", calories: 480, protein: 32 },
      { time: "9:50 AM", name: "Black coffee", calories: 5, protein: 0 },
      { time: "12:42 PM", name: "Chicken bowl", calories: 620, protein: 48 },
      { time: "4:08 PM", name: "Greek yogurt + whey", calories: 230, protein: 32 },
    ],
  },
  {
    date: "Yesterday",
    entries: [
      { time: "8:00 AM", name: "Oatmeal + banana", calories: 410, protein: 18 },
      { time: "12:30 PM", name: "Salmon bowl", calories: 580, protein: 42 },
      { time: "3:30 PM", name: "Apple + almonds", calories: 220, protein: 6 },
      { time: "7:30 PM", name: "Beef stir-fry + rice", calories: 660, protein: 44 },
    ],
  },
  {
    date: "May 2",
    entries: [
      { time: "7:45 AM", name: "Eggs + toast", calories: 380, protein: 26 },
      { time: "1:00 PM", name: "Turkey sandwich", calories: 520, protein: 38 },
      { time: "8:00 PM", name: "Pasta primavera", calories: 540, protein: 22 },
    ],
  },
];

export default function FoodLogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Nutrition", href: "/admin/spaces/nutrition" }]}
        title="Food Log"
        description="Log what you ate and stay on top of your macros."
        action={
          <Button size="sm" className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90">
            <Plus className="h-4 w-4 mr-1.5" />
            Log food
          </Button>
        }
      />

      <div className="space-y-6">
        {log.map((day) => {
          const dayCalories = day.entries.reduce((s, e) => s + e.calories, 0);
          const dayProtein = day.entries.reduce((s, e) => s + e.protein, 0);
          return (
            <section
              key={day.date}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <header className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-base font-semibold">{day.date}</h2>
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {dayCalories} kcal · {dayProtein}g protein
                </p>
              </header>
              <ul className="divide-y divide-border">
                {day.entries.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 px-6 py-3 hover:bg-accent/30"
                  >
                    <span className="text-xs text-muted-foreground w-20 shrink-0 tabular-nums">
                      {e.time}
                    </span>
                    <p className="flex-1 text-sm font-medium">{e.name}</p>
                    <span className="text-xs text-muted-foreground tabular-nums w-20 text-right">
                      P {e.protein}g
                    </span>
                    <span className="text-sm font-semibold tabular-nums w-20 text-right">
                      {e.calories} kcal
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
