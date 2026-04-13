"use client";

import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormsEmptyProps {
  onCreateClick: () => void;
}

export function FormsEmpty({ onCreateClick }: FormsEmptyProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border border-dashed bg-card">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-violet-500/10 mb-5">
        <ClipboardList className="h-8 w-8 text-violet-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Create intake forms, surveys, and data collection templates. Forms can
        be shared with partners and customers to gather structured information.
      </p>
      <Button variant="outline" onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Create your first form
      </Button>
    </div>
  );
}
