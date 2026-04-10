"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { PagesEmptyState } from "./pages-empty-state";
import { PageCreateDialog } from "./page-create-dialog";
import { PageCard } from "./page-card";
import type { LandingPageData } from "@/types/landing-page";

interface PagesListClientProps {
  initialPages: LandingPageData[];
}

export function PagesListClient({ initialPages }: PagesListClientProps) {
  const [pages, setPages] = useState<LandingPageData[]>(initialPages);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handlePageCreated = (page: LandingPageData) => {
    setPages((prev) => [page, ...prev]);
  };

  const handlePageDuplicated = (page: LandingPageData) => {
    setPages((prev) => [page, ...prev]);
  };

  const handlePageDeleted = (pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
  };

  if (pages.length === 0) {
    return (
      <>
        <PageHeader title="Pages" description="Build and publish landing pages" />
        <PagesEmptyState onCreatePage={() => setCreateDialogOpen(true)} />
        <PageCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={handlePageCreated}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Pages"
        description="Build and publish landing pages"
        action={
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Page
          </Button>
        }
      />
      <div className="px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <PageCard
              key={page.id}
              page={page}
              onDuplicate={handlePageDuplicated}
              onDelete={handlePageDeleted}
            />
          ))}
        </div>
      </div>
      <PageCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handlePageCreated}
      />
    </>
  );
}
