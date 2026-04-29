"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SectionComposer } from "@/components/marketplace/composer/section-composer";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function StepSection({ onNext, onBack }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Compose the section page</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Stack components to design how the section&apos;s page looks. Click a component to
            edit it on the right. Leaving the canvas empty falls back to a default item grid.
          </p>
        </div>

        <SectionComposer />
      </div>
      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button onClick={onNext}>
          <ArrowRight className="h-4 w-4 mr-2" /> Next: Identity
        </Button>
      </div>
    </div>
  );
}
