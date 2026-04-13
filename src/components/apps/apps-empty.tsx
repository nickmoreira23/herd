"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plug, Plus } from "lucide-react";

export function AppsEmpty() {
  return (
    <div className="flex flex-col min-h-full pt-2 pl-2">
      <PageHeader
        title="Apps"
        description="Connect fitness apps to sync health data into your knowledge base."
        className="pl-0 pt-0"
        action={
          <Button size="sm" disabled>
            <Plus className="mr-1 h-3 w-3" />
            Connect App
          </Button>
        }
      />

      {/* Empty state — fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border border-dashed bg-card">
        <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-violet-500/10 mb-5">
          <Plug className="h-8 w-8 text-violet-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No apps connected</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Connect fitness apps like Oura Ring, WHOOP, and Apple Health to
          automatically sync health data. Your AI agents can then use this data
          to provide personalized insights.
        </p>
        <Button variant="outline" disabled>
          <Plug className="mr-2 h-4 w-4" />
          Connect your first app
        </Button>
      </div>
    </div>
  );
}
