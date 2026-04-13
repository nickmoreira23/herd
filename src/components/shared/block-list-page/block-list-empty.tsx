"use client";

import { Inbox, type LucideIcon } from "lucide-react";

interface BlockListEmptyProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function BlockListEmpty({
  icon: Icon = Inbox,
  title = "No items yet",
  description = "Get started by creating your first item.",
  action,
}: BlockListEmptyProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
