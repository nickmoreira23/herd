"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
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
import { toast } from "sonner";

interface TierCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function TierCreateSheet({ open, onOpenChange, onCreated }: TierCreateSheetProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Plan name is required");
      return;
    }
    if (!monthlyPrice || Number(monthlyPrice) <= 0) {
      setError("Monthly price must be greater than $0");
      return;
    }

    setSaving(true);
    try {
      const price = Number(monthlyPrice);
      const slug = slugify(name);

      const res = await fetch("/api/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug,
          status,
          monthlyPrice: price,
          quarterlyPrice: price, // default same as monthly
          annualPrice: price, // default same as monthly
          monthlyCredits: 0,
          partnerDiscountPercent: 0,
          apparelCadence: "NONE",
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to create plan");
        setSaving(false);
        return;
      }

      toast.success("Plan created");
      onCreated();
      onOpenChange(false);

      // Reset form
      setName("");
      setStatus("DRAFT");
      setMonthlyPrice("");

      // Navigate to full edit view
      router.push(`/admin/tiers/${json.data.id}`);
    } catch {
      setError("Failed to create plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>New Plan</SheetTitle>
          <SheetDescription>
            Create a new plan with basic details. You&apos;ll configure the full
            settings after creation.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 flex-1">
          {/* Tier name */}
          <div className="space-y-1.5">
            <Label htmlFor="tier-name">Plan name</Label>
            <Input
              id="tier-name"
              placeholder="e.g. Performance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {name && (
              <p className="text-[11px] text-muted-foreground">
                Slug: <span className="font-mono">{slugify(name)}</span>
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(val) => setStatus(val ?? "DRAFT")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Monthly price */}
          <div className="space-y-1.5">
            <Label htmlFor="tier-price">Monthly price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="tier-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="99.00"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </form>

        <SheetFooter>
          <Button
            className="w-full bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? "Creating..." : "Create plan"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
