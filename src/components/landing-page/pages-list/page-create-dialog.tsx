"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LandingPageData } from "@/types/landing-page";

interface PageCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (page: LandingPageData) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function PageCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: PageCreateDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setSlug(slugify(value));
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to create page");
        return;
      }

      toast.success("Page created");
      onCreated?.(json.data);
      onOpenChange(false);
      setName("");
      setSlug("");
      setSlugEdited(false);
      router.push(`/editor/${json.data.id}`);
    } catch {
      toast.error("Failed to create page");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new page</DialogTitle>
          <DialogDescription>
            Give your landing page a name. You can change it later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="page-name">Name</Label>
            <Input
              id="page-name"
              placeholder="e.g. Homepage"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-slug">Slug</Label>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>/p/</span>
              <Input
                id="page-slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="homepage"
                className="flex-1"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={saving || !name.trim() || !slug.trim()}
            size="sm"
          >
            {saving ? "Creating..." : "Create page"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
