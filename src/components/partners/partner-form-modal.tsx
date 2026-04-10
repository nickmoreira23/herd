"use client";

import { useState, useEffect } from "react";
import type { PartnerBrand, PartnerTierAssignment, SubscriptionTier } from "@/types";
import { KICKBACK_TYPES } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PartnerWithAssignments = PartnerBrand & {
  tierAssignments: (PartnerTierAssignment & { tier: SubscriptionTier })[];
};

interface PartnerFormModalProps {
  partner?: PartnerWithAssignments | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Record<string, unknown>) => void;
}

const KICKBACK_LABELS: Record<string, string> = {
  NONE: "None",
  PERCENT_OF_SALE: "% of Sale",
  FLAT_PER_REFERRAL: "Flat per Referral",
  FLAT_PER_MONTH: "Flat per Month",
};

const PARTNER_CATEGORIES = [
  "Supplements",
  "Fitness",
  "Apparel",
  "Nutrition",
  "Recovery",
  "Technology",
  "Other",
];

export function PartnerFormModal({
  partner,
  open,
  onOpenChange,
  onSave,
}: PartnerFormModalProps) {
  const [form, setForm] = useState({
    name: "",
    key: "",
    logoUrl: "",
    discountDescription: "",
    websiteUrl: "",
    isActive: true,
    kickbackType: "NONE" as string,
    kickbackValue: "",
    category: "Supplements",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name,
        key: partner.key,
        logoUrl: partner.logoUrl || "",
        discountDescription: partner.discountDescription || "",
        websiteUrl: partner.websiteUrl || "",
        isActive: partner.isActive,
        kickbackType: partner.kickbackType,
        kickbackValue: partner.kickbackValue ? String(partner.kickbackValue) : "",
        category: partner.category,
      });
    } else {
      setForm({
        name: "",
        key: "",
        logoUrl: "",
        discountDescription: "",
        websiteUrl: "",
        isActive: true,
        kickbackType: "NONE",
        kickbackValue: "",
        category: "Supplements",
      });
    }
  }, [partner, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: form.name,
        key: form.key,
        logoUrl: form.logoUrl || undefined,
        discountDescription: form.discountDescription || undefined,
        websiteUrl: form.websiteUrl || undefined,
        isActive: form.isActive,
        kickbackType: form.kickbackType,
        kickbackValue: form.kickbackValue ? parseFloat(form.kickbackValue) : undefined,
        category: form.category,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {partner ? "Edit Partner" : "New Partner"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const updates: Record<string, string> = { name };
                  if (!partner) {
                    updates.key = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
                  }
                  setForm((prev) => ({ ...prev, ...updates }));
                }}
              />
            </div>
            <div>
              <Label>Key</Label>
              <Input
                required
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="lowercase_snake_case"
                disabled={!!partner}
                className={partner ? "opacity-60" : ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(val) => setForm({ ...form, category: val ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Website URL</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={form.websiteUrl}
                onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Discount Description</Label>
            <Textarea
              placeholder="e.g., 20% off all products for HERD subscribers"
              value={form.discountDescription}
              onChange={(e) =>
                setForm({ ...form, discountDescription: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Kickback Type</Label>
              <Select
                value={form.kickbackType}
                onValueChange={(val) => setForm({ ...form, kickbackType: val ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KICKBACK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {KICKBACK_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.kickbackType !== "NONE" && (
              <div>
                <Label>
                  {form.kickbackType === "PERCENT_OF_SALE"
                    ? "Kickback %"
                    : "Kickback Amount ($)"}
                </Label>
                <Input
                  type="number"
                  step={form.kickbackType === "PERCENT_OF_SALE" ? "0.1" : "0.01"}
                  value={form.kickbackValue}
                  onChange={(e) =>
                    setForm({ ...form, kickbackValue: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={(val) => setForm({ ...form, isActive: val })}
            />
            <Label>Active</Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : partner ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
