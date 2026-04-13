"use client";

import { CheckCircle2, Store, CreditCard } from "lucide-react";

export interface ActivityItem {
  type: "created" | "updated" | "deleted";
  label: string;
  icon?: "store" | "credit" | "check";
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-2.5 space-y-1.5 mt-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Changes Made
      </p>
      {items.map((activity, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-[11px] animate-in fade-in slide-in-from-bottom-1 duration-300"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {activity.type === "deleted" ? (
            <>
              <span className="text-red-400 shrink-0">&#10005;</span>
              <span className="text-muted-foreground truncate">
                {activity.label}
              </span>
            </>
          ) : (
            <>
              <ActivityIcon icon={activity.icon} />
              <span className="truncate">{activity.label}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function ActivityIcon({ icon }: { icon?: string }) {
  switch (icon) {
    case "store":
      return <Store className="h-3 w-3 text-[#C5F135] shrink-0" />;
    case "credit":
      return <CreditCard className="h-3 w-3 text-blue-500 shrink-0" />;
    default:
      return <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />;
  }
}
