"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const FITNESS_GOALS = [
  { value: "WEIGHT_LOSS", label: "Weight Loss" },
  { value: "MUSCLE_GAIN", label: "Muscle Gain" },
  { value: "PERFORMANCE", label: "Performance" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "GENERAL_WELLNESS", label: "General Wellness" },
  { value: "RECOVERY", label: "Recovery" },
];

interface PackageCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function PackageCreateSheet({
  open,
  onOpenChange,
  onCreated,
}: PackageCreateSheetProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleCreate() {
    if (!name.trim() || !fitnessGoal) {
      toast.error("Name and fitness goal are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slugify(name.trim()),
          fitnessGoal,
          description: description.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create package");
        return;
      }

      toast.success("Package created");
      onCreated();
      router.push(`/admin/program/packages/${json.data.id}`);
    } catch {
      toast.error("Failed to create package");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New Package</SheetTitle>
          <SheetDescription>
            Create a product bundle for a specific fitness goal. Tier variants will be auto-created for all active plans.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label>Package Name</Label>
            <Input
              placeholder="e.g., Weight Loss Essentials"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Fitness Goal</Label>
            <Select value={fitnessGoal} onValueChange={(v) => v && setFitnessGoal(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a fitness goal" />
              </SelectTrigger>
              <SelectContent>
                {FITNESS_GOALS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="Describe what this package includes and who it's for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={saving || !name.trim() || !fitnessGoal}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Package
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
