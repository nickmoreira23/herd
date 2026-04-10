"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Link2, Plus } from "lucide-react";
import { KnowledgeAddLinkModal } from "./knowledge-add-link-modal";
import { useRouter } from "next/navigation";

export function KnowledgeLinksEmpty() {
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title="Links"
          description="Add URLs to scrape and import web content into your knowledge base."
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Link
            </Button>
          }
        />

        {/* Empty state — fills remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border border-dashed bg-card">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-orange-500/10 mb-5">
            <Link2 className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No links yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Add URLs to automatically scrape and import web page content into
            your knowledge base. Keep your knowledge up to date with external
            sources.
          </p>
          <Button variant="outline" onClick={() => setShowAdd(true)}>
            <Link2 className="mr-2 h-4 w-4" />
            Add your first link
          </Button>
        </div>
      </div>

      <KnowledgeAddLinkModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
