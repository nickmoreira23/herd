"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  EyeOff,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  sectionId: string;
  sectionName: string;
  sectionSlug: string;
  sectionStatus: string;
  sectionDescription: string | null;
}

export function SectionPreviewHeader({
  sectionId,
  sectionName,
  sectionSlug,
  sectionStatus,
  sectionDescription,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleStatus() {
    const next = sectionStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setBusy(true);
    const res = await fetch(`/api/marketplace/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Failed to update status");
      return;
    }
    toast.success(next === "PUBLISHED" ? "Section published" : "Section moved to draft");
    window.dispatchEvent(new Event("marketplace-sections-updated"));
    router.refresh();
  }

  async function deleteSection() {
    if (!confirm(`Delete "${sectionName}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/marketplace/sections/${sectionId}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Failed to delete section");
      return;
    }
    toast.success("Section deleted");
    window.dispatchEvent(new Event("marketplace-sections-updated"));
    router.push("/admin/marketplace");
  }

  return (
    <div className="flex items-start justify-between gap-4 pt-8 pb-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-semibold">{sectionName}</h1>
          <Badge
            variant={sectionStatus === "PUBLISHED" ? "default" : "secondary"}
            className="text-[10px]"
          >
            {sectionStatus.toLowerCase()}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {sectionDescription ?? `/explore/${sectionSlug}`}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={busy}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50"
          aria-label="Section options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onClick={() =>
              router.push(`/admin/marketplace/sections/${sectionId}/edit`)
            }
          >
            <Pencil className="h-4 w-4 mr-2" /> Edit section
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleStatus}>
            {sectionStatus === "PUBLISHED" ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" /> Move to draft
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" /> Publish
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/explore/${sectionSlug}`
              );
              toast.success("Public link copied");
            }}
          >
            <Copy className="h-4 w-4 mr-2" /> Copy public link
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              window.open(`/explore/${sectionSlug}`, "_blank", "noreferrer")
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" /> Open public view
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={deleteSection}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete section
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
