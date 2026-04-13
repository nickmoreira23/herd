"use client";

import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlockListPage } from "@/components/shared/block-list-page";
import { PageCard } from "./page-card";
import { PageCreateDialog } from "./page-create-dialog";
import type { LandingPageData } from "@/types/landing-page";

// ── Column definitions ──────────────────────────────────────────────

const columns: ColumnDef<LandingPageData, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.name}</p>
        {row.original.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {row.original.description}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const className =
        status === "PUBLISHED"
          ? "bg-emerald-500/10 text-emerald-500"
          : status === "ARCHIVED"
            ? "bg-red-500/10 text-red-500"
            : "bg-amber-500/10 text-amber-500"; // DRAFT
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground font-mono">
        {row.original.slug}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.updatedAt).toLocaleDateString()}
      </span>
    ),
  },
];

// ── Component ───────────────────────────────────────────────────────

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

  return (
    <BlockListPage<LandingPageData>
      blockName="pages"
      title="Pages"
      description="Build and publish landing pages"
      data={pages}
      getId={(page) => page.id}
      columns={columns}
      searchPlaceholder="Search pages..."
      searchFn={(page, query) =>
        page.name.toLowerCase().includes(query) ||
        page.slug.toLowerCase().includes(query)
      }
      headerActions={
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Page
        </Button>
      }
      additionalViews={[
        {
          type: "card" as const,
          render: (data) => (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((page) => (
                <PageCard
                  key={page.id}
                  page={page}
                  onDuplicate={handlePageDuplicated}
                  onDelete={handlePageDeleted}
                />
              ))}
            </div>
          ),
        },
      ]}
      emptyIcon={FileText}
      emptyTitle="No pages yet"
      emptyDescription="Create your first landing page."
      modals={
        <PageCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={handlePageCreated}
        />
      }
    />
  );
}
