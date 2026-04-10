"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Copy, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LandingPageData } from "@/types/landing-page";

interface PageCardProps {
  page: LandingPageData;
  onDuplicate: (page: LandingPageData) => void;
  onDelete: (pageId: string) => void;
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PageCard({ page, onDuplicate, onDelete }: PageCardProps) {
  const handleDuplicate = async () => {
    try {
      const res = await fetch("/api/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${page.name} (copy)`,
          slug: `${page.slug}-copy-${Date.now().toString(36)}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to duplicate");
        return;
      }
      toast.success("Page duplicated");
      onDuplicate(json.data);
    } catch {
      toast.error("Failed to duplicate page");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/landing-pages/${page.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to delete");
        return;
      }
      toast.success("Page deleted");
      onDelete(page.id);
    } catch {
      toast.error("Failed to delete page");
    }
  };

  return (
    <div className="group relative flex flex-col rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/editor/${page.id}`}
          className="flex-1 min-w-0"
        >
          <h3 className="font-medium truncate">{page.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            /p/{page.slug}
          </p>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            }
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/editor/${page.id}`} />}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            {page.status === "PUBLISHED" && (
              <DropdownMenuItem render={<Link href={`/p/${page.slug}`} target="_blank" />}>
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                View live
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="h-3.5 w-3.5 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Badge variant={statusVariant[page.status] || "secondary"}>
          {page.status.charAt(0) + page.status.slice(1).toLowerCase()}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDate(page.updatedAt)}
        </span>
      </div>
    </div>
  );
}
