"use client";

import { useState, useEffect } from "react";
import type { PartnerBrand, PartnerTierAssignment, SubscriptionTier } from "@/types";
import {
  KICKBACK_TYPES,
  PARTNER_BENEFIT_TYPES,
  PARTNER_COMMISSION_TYPES,
  PARTNER_STATUSES,
  PARTNER_TIER_ACCESS,
  PARTNER_CATEGORIES,
} from "@/types";
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

const BENEFIT_TYPE_LABELS: Record<string, string> = {
  PERCENTAGE_DISCOUNT: "Percentage Discount",
  FLAT_DISCOUNT: "Flat Discount",
  FREE_TRIAL: "Free Trial",
  FREE_PRODUCT: "Free Product",
  BOGO: "BOGO",
  OTHER: "Other",
};

const COMMISSION_TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: "Percentage",
  FLAT: "Flat",
  CPA: "CPA",
  RECURRING: "Recurring",
  HYBRID: "Hybrid",
};

const STATUS_LABELS: Record<string, string> = {
  RESEARCHED: "Researched",
  APPLIED: "Applied",
  APPROVED: "Approved",
  ACTIVE: "Active",
  PAUSED: "Paused",
};

const TIER_ACCESS_LABELS: Record<string, string> = {
  ALL: "All Tiers",
  BASIC: "Basic",
  PLUS: "Plus",
  PREMIUM: "Premium",
  ELITE: "Elite",
};

interface FormState {
  name: string;
  logoUrl: string;
  discountDescription: string;
  websiteUrl: string;
  kickbackType: string;
  kickbackValue: string;
  category: string;
  // New fields
  tagline: string;
  description: string;
  audienceBenefit: string;
  benefitType: string;
  affiliateSignupUrl: string;
  affiliateLinkPlaceholder: string;
  affiliateNetwork: string;
  commissionRate: string;
  commissionType: string;
  cookieDuration: string;
  status: string;
  tierAccess: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  logoUrl: "",
  discountDescription: "",
  websiteUrl: "",
  kickbackType: "NONE",
  kickbackValue: "",
  category: "Supplements & Sports Nutrition",
  tagline: "",
  description: "",
  audienceBenefit: "",
  benefitType: "",
  affiliateSignupUrl: "",
  affiliateLinkPlaceholder: "",
  affiliateNetwork: "",
  commissionRate: "",
  commissionType: "",
  cookieDuration: "",
  status: "RESEARCHED",
  tierAccess: "ALL",
  notes: "",
};

export function PartnerFormModal({
  partner,
  open,
  onOpenChange,
  onSave,
}: PartnerFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name,
        logoUrl: partner.logoUrl || "",
        discountDescription: partner.discountDescription || "",
        websiteUrl: partner.websiteUrl || "",
        kickbackType: partner.kickbackType,
        kickbackValue: partner.kickbackValue ? String(partner.kickbackValue) : "",
        category: partner.category,
        tagline: partner.tagline || "",
        description: partner.description || "",
        audienceBenefit: partner.audienceBenefit || "",
        benefitType: partner.benefitType || "",
        affiliateSignupUrl: partner.affiliateSignupUrl || "",
        affiliateLinkPlaceholder: partner.affiliateLinkPlaceholder || "",
        affiliateNetwork: partner.affiliateNetwork || "",
        commissionRate: partner.commissionRate || "",
        commissionType: partner.commissionType || "",
        cookieDuration: partner.cookieDuration || "",
        status: partner.status || "ACTIVE",
        tierAccess: partner.tierAccess || "ALL",
        notes: partner.notes || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [partner, open]);

  function set(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        name: form.name,
        category: form.category,
        kickbackType: form.kickbackType,
        status: form.status || undefined,
        tierAccess: form.tierAccess || undefined,
      };

      // Only include optional fields if they have values
      if (form.logoUrl) data.logoUrl = form.logoUrl;
      if (form.discountDescription) data.discountDescription = form.discountDescription;
      if (form.websiteUrl) data.websiteUrl = form.websiteUrl;
      if (form.kickbackValue) data.kickbackValue = parseFloat(form.kickbackValue);
      if (form.tagline) data.tagline = form.tagline;
      if (form.description) data.description = form.description;
      if (form.audienceBenefit) data.audienceBenefit = form.audienceBenefit;
      if (form.benefitType) data.benefitType = form.benefitType;
      if (form.affiliateSignupUrl) data.affiliateSignupUrl = form.affiliateSignupUrl;
      if (form.affiliateLinkPlaceholder) data.affiliateLinkPlaceholder = form.affiliateLinkPlaceholder;
      if (form.affiliateNetwork) data.affiliateNetwork = form.affiliateNetwork;
      if (form.commissionRate) data.commissionRate = form.commissionRate;
      if (form.commissionType) data.commissionType = form.commissionType;
      if (form.cookieDuration) data.cookieDuration = form.cookieDuration;
      if (form.notes) data.notes = form.notes;

      // Set isActive based on status
      data.isActive = form.status === "ACTIVE";

      await onSave(data);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {partner ? "Edit Partner" : "New Partner"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Info */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(val) => set("category", val ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Website URL</Label>
                <Input type="url" placeholder="https://..." value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} />
              </div>
              <div>
                <Label>Logo URL</Label>
                <Input type="url" placeholder="https://..." value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Tagline</Label>
              <Input placeholder="Short brand tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </div>
          </fieldset>

          {/* Section 2: Audience Benefit */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Audience Benefit</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Benefit Summary</Label>
                <Input placeholder='e.g. "20% off your first order"' value={form.audienceBenefit} onChange={(e) => set("audienceBenefit", e.target.value)} />
              </div>
              <div>
                <Label>Benefit Type</Label>
                <Select value={form.benefitType} onValueChange={(val) => set("benefitType", val ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_BENEFIT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{BENEFIT_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="2-3 sentence description of the company" value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Discount Description (legacy)</Label>
              <Textarea placeholder="e.g., 20% off all products for HERD subscribers" value={form.discountDescription} onChange={(e) => set("discountDescription", e.target.value)} rows={2} />
            </div>
          </fieldset>

          {/* Section 3: Affiliate Program */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Affiliate Program</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Affiliate Signup URL</Label>
                <Input type="url" placeholder="https://..." value={form.affiliateSignupUrl} onChange={(e) => set("affiliateSignupUrl", e.target.value)} />
              </div>
              <div>
                <Label>Affiliate Link / Code</Label>
                <Input placeholder="Filled after signup approval" value={form.affiliateLinkPlaceholder} onChange={(e) => set("affiliateLinkPlaceholder", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Commission Rate</Label>
                <Input placeholder='e.g. "15%"' value={form.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} />
              </div>
              <div>
                <Label>Commission Type</Label>
                <Select value={form.commissionType} onValueChange={(val) => set("commissionType", val ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_COMMISSION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{COMMISSION_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cookie Duration</Label>
                <Input placeholder='e.g. "30 days"' value={form.cookieDuration} onChange={(e) => set("cookieDuration", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Affiliate Network</Label>
              <Input placeholder='e.g. "Impact", "ShareASale"' value={form.affiliateNetwork} onChange={(e) => set("affiliateNetwork", e.target.value)} />
            </div>
          </fieldset>

          {/* Section 4: Kickback (HERD pays) */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Kickback (HERD Pays)</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kickback Type</Label>
                <Select value={form.kickbackType} onValueChange={(val) => set("kickbackType", val ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KICKBACK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{KICKBACK_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.kickbackType !== "NONE" && (
                <div>
                  <Label>
                    {form.kickbackType === "PERCENT_OF_SALE" ? "Kickback %" : "Kickback Amount ($)"}
                  </Label>
                  <Input
                    type="number"
                    step={form.kickbackType === "PERCENT_OF_SALE" ? "0.1" : "0.01"}
                    value={form.kickbackValue}
                    onChange={(e) => set("kickbackValue", e.target.value)}
                  />
                </div>
              )}
            </div>
          </fieldset>

          {/* Section 5: Status & Access */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Status & Access</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(val) => set("status", val ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tier Access</Label>
                <Select value={form.tierAccess} onValueChange={(val) => set("tierAccess", val ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_TIER_ACCESS.map((t) => (
                      <SelectItem key={t} value={t}>{TIER_ACCESS_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </fieldset>

          {/* Section 6: Notes */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Internal Notes</legend>
            <Textarea placeholder="Internal notes about this partner..." value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </fieldset>

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
