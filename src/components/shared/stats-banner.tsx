"use client";

import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  value: string;
  subtext?: string;
  colorClass?: string;
}

interface StatsBannerProps {
  stats: StatCard[];
}

export function StatsBanner({ stats }: StatsBannerProps) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border bg-card p-4"
        >
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className={cn("text-2xl font-bold mt-1", stat.colorClass)}>
            {stat.value}
          </p>
          {stat.subtext && (
            <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
          )}
        </div>
      ))}
    </div>
  );
}
