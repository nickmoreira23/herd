"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMarketplaceWizardStore } from "@/stores/marketplace-section-wizard-store";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function StepIdentity({ onNext, onBack }: Props) {
  const {
    name,
    slug,
    description,
    setName,
    setSlug,
    setDescription,
  } = useMarketplaceWizardStore();

  // Auto-derive slug from name unless the user has typed one already.
  useEffect(() => {
    if (!slug && name) setSlug(slugify(name));
  }, [name, slug, setSlug]);

  const canProceed = !!name.trim() && !!slug.trim();

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Section identity</h2>
          <p className="text-sm text-muted-foreground mt-1">
            How this section is labelled in Marketplace and Explore.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ms-name">Name</Label>
          <Input
            id="ms-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Supplements"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ms-slug">Slug</Label>
          <Input
            id="ms-slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="supplements"
          />
          <p className="text-[11px] text-muted-foreground">
            Lowercase letters, numbers, and dashes. Used in the section URL.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ms-desc">Description (optional)</Label>
          <Textarea
            id="ms-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description shown under the section title."
            rows={3}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          <ArrowRight className="h-4 w-4 mr-2" /> Next: Review
        </Button>
      </div>
    </div>
  );
}
