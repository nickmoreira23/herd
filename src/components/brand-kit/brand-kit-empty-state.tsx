"use client";

import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrandKitEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function BrandKitEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: BrandKitEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-5">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
