"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BrandKitSectionProps {
  title: string;
  description?: string;
  saving?: boolean;
  loading?: boolean;
  onSave?: () => void;
  /** Extra actions to the right of the save button */
  actions?: ReactNode;
  children: ReactNode;
}

export function BrandKitSection({
  title,
  description,
  saving,
  loading,
  onSave,
  actions,
  children,
}: BrandKitSectionProps) {
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-40 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
          </div>
          <div className="h-9 w-16 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between pl-4 pt-2 mb-2">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 pr-8">
          {actions}
          {onSave && (
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </div>
      <div className="max-w-[800px] mx-auto space-y-6">
        {children}
      </div>
    </div>
  );
}
