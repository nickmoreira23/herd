"use client";

import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PagesEmptyStateProps {
  onCreatePage: () => void;
}

export function PagesEmptyState({ onCreatePage }: PagesEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">No pages yet</h2>
          <p className="text-muted-foreground text-sm">
            Create your first landing page and start building. Design sections,
            add components, and publish when you&apos;re ready.
          </p>
        </div>
        <Button onClick={onCreatePage} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Create your first page
        </Button>
      </div>
    </div>
  );
}
