"use client";

import { cn } from "@/lib/utils";

interface CreditBudgetBarProps {
  used: number;
  budget: number;
  className?: string;
}

export function CreditBudgetBar({ used, budget, className }: CreditBudgetBarProps) {
  const percent = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
  const overBudget = used > budget;

  const barColor = overBudget
    ? "bg-red-500"
    : percent >= 80
      ? "bg-yellow-500"
      : "bg-emerald-500";

  const textColor = overBudget
    ? "text-red-600"
    : percent >= 80
      ? "text-yellow-600"
      : "text-emerald-600";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Credits Used</span>
        <span className={cn("font-medium", textColor)}>
          ${used.toFixed(2)} / ${budget.toFixed(2)}
          {overBudget && (
            <span className="ml-1 text-red-500 text-xs font-normal">
              (${(used - budget).toFixed(2)} over)
            </span>
          )}
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{percent.toFixed(0)}% used</span>
        <span>${Math.max(budget - used, 0).toFixed(2)} remaining</span>
      </div>
    </div>
  );
}
