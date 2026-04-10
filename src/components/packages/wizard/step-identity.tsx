"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ImageSelector } from "./image-selector";
import { usePackageWizardStore } from "@/stores/package-wizard-store";

interface StepIdentityProps {
  onNext: () => void;
  onBack: () => void;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function StepIdentity({ onNext, onBack }: StepIdentityProps) {
  const {
    packageId,
    name,
    description,
    imageUrl,
    fitnessGoal,
    creationPath,
    setName,
    setDescription,
    setImageUrl,
  } = usePackageWizardStore();

  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const aiTriggered = useRef(false);

  const slug = slugify(name);
  const canProceed = name.trim().length > 0;

  // Co-Pilot: auto-generate name + description on mount
  useEffect(() => {
    if (creationPath !== "copilot" || !packageId || aiTriggered.current) return;
    aiTriggered.current = true;

    async function generateIdentity() {
      setAiLoading(true);
      try {
        const res = await fetch(`/api/packages/${packageId}/ai-identity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fitnessGoal }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.name) setName(json.data.name);
          if (json.data?.description) setDescription(json.data.description);
        }
      } catch {
        // Silent — user can fill in manually
      } finally {
        setAiLoading(false);
      }
    }

    generateIdentity();
  }, [creationPath, packageId, fitnessGoal, setName, setDescription]);

  async function handleNext() {
    if (!canProceed || !packageId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/packages/${packageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: `${slug}-${Date.now()}`,
          description: description.trim() || null,
          imageUrl,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(json?.error || "Failed to save package identity");
        return;
      }

      onNext();
    } catch {
      toast.error("Failed to save package identity");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Package Identity</h2>
          <p className="text-sm text-muted-foreground mt-1">
            How should this package appear to members?
          </p>
        </div>

        {/* AI loading indicator for co-pilot mode */}
        {aiLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-[#C5F135]/5 rounded-lg px-4 py-3">
            <Sparkles className="h-4 w-4 text-[#C5F135] animate-pulse" />
            Generating name and description...
          </div>
        )}

        {/* Image selector */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Package Image</Label>
          <ImageSelector value={imageUrl} fitnessGoal={fitnessGoal} onChange={setImageUrl} />
        </div>

        {/* Package Name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Package Name</Label>
          <Input
            placeholder="e.g., Weight Loss Essentials"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {slug && (
            <p className="text-xs text-muted-foreground">
              Slug: <span className="font-mono">{slug}</span>
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Description{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            placeholder="Describe who this package is for and what it helps with..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed || saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4 mr-2" />
          )}
          {saving ? "Saving..." : "Next: Review"}
        </Button>
      </div>
    </div>
  );
}
