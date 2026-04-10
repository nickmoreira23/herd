"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PARTNER_CATEGORIES,
  PARTNER_STATUSES,
  PARTNER_BENEFIT_TYPES,
  PARTNER_COMMISSION_TYPES,
  PARTNER_TIER_ACCESS,
  KICKBACK_TYPES,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FormState {
  name: string;
  category: string;
  status: string;
  websiteUrl: string;
  affiliateNetwork: string;
  affiliateUrl: string;
  benefitType: string;
  benefitValue: string;
  audienceBenefit: string;
  commissionType: string;
  commissionValue: string;
  kickbackType: string;
  kickbackValue: string;
  tierAccess: string;
  notes: string;
  tags: string;
}

const DEFAULT_FORM: FormState = {
  name: "",
  category: "Supplements & Sports Nutrition",
  status: "RESEARCHED",
  websiteUrl: "",
  affiliateNetwork: "",
  affiliateUrl: "",
  benefitType: "PERCENTAGE_DISCOUNT",
  benefitValue: "",
  audienceBenefit: "",
  commissionType: "PERCENTAGE",
  commissionValue: "",
  kickbackType: "NONE",
  kickbackValue: "",
  tierAccess: "ALL",
  notes: "",
  tags: "",
};

export default function NewPartnerPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const handleCreate = useCallback(async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          status: form.status,
          websiteUrl: form.websiteUrl || undefined,
          affiliateNetwork: form.affiliateNetwork || undefined,
          affiliateUrl: form.affiliateUrl || undefined,
          benefitType: form.benefitType,
          benefitValue: form.benefitValue || undefined,
          audienceBenefit: form.audienceBenefit || undefined,
          commissionType: form.commissionType,
          commissionValue: form.commissionValue || undefined,
          kickbackType: form.kickbackType,
          kickbackValue: form.kickbackValue ? parseFloat(form.kickbackValue) : undefined,
          tierAccess: form.tierAccess,
          notes: form.notes || undefined,
          tags: form.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to create partner");
        return;
      }
      const json = await res.json();
      toast.success("Partner created");
      router.push(`/admin/brands/${json.data.id}`);
    } finally {
      setSaving(false);
    }
  }, [form, router]);

  return (
    <div className="flex flex-col -m-6 min-h-[100vh]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b py-3 px-4">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/brands"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Partners
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium">New Partner</span>
          <div className="ml-1">
            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[11px] px-1.5 py-0">
              Researched
            </Badge>
          </div>
        </nav>

        <Button
          size="sm"
          className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
          onClick={handleCreate}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Creating
            </>
          ) : (
            "Create"
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-8">
          {/* Overview */}
          <section className="space-y-5">
            <h2 className="text-sm font-semibold">Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Partner name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => v && update("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => v && update("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tier Access</Label>
                <Select value={form.tierAccess} onValueChange={(v) => v && update("tierAccess", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_TIER_ACCESS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Website URL</Label>
              <Input
                value={form.websiteUrl}
                onChange={(e) => update("websiteUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </section>

          {/* Affiliate */}
          <section className="space-y-5 border-t pt-6">
            <h2 className="text-sm font-semibold">Affiliate Program</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Network</Label>
                <Input
                  value={form.affiliateNetwork}
                  onChange={(e) => update("affiliateNetwork", e.target.value)}
                  placeholder="e.g. Impact, ShareASale"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Affiliate URL</Label>
                <Input
                  value={form.affiliateUrl}
                  onChange={(e) => update("affiliateUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>

          {/* Benefits & Commission */}
          <section className="space-y-5 border-t pt-6">
            <h2 className="text-sm font-semibold">Benefits & Commission</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Benefit Type</Label>
                <Select value={form.benefitType} onValueChange={(v) => v && update("benefitType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_BENEFIT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Benefit Value</Label>
                <Input
                  value={form.benefitValue}
                  onChange={(e) => update("benefitValue", e.target.value)}
                  placeholder="e.g. 20% off, Free trial"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Audience Benefit Description</Label>
                <Input
                  value={form.audienceBenefit}
                  onChange={(e) => update("audienceBenefit", e.target.value)}
                  placeholder="What does the audience get?"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Commission Type</Label>
                <Select value={form.commissionType} onValueChange={(v) => v && update("commissionType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_COMMISSION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Commission Value</Label>
                <Input
                  value={form.commissionValue}
                  onChange={(e) => update("commissionValue", e.target.value)}
                  placeholder="e.g. 15%"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kickback Type</Label>
                <Select value={form.kickbackType} onValueChange={(v) => v && update("kickbackType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KICKBACK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.kickbackType !== "NONE" && (
                <div className="space-y-1.5">
                  <Label>Kickback Value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.kickbackValue}
                    onChange={(e) => update("kickbackValue", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Notes & Tags */}
          <section className="space-y-5 border-t pt-6">
            <h2 className="text-sm font-semibold">Notes</h2>
            <div className="space-y-1.5">
              <Textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Internal notes..."
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) => update("tags", e.target.value)}
                placeholder="fitness, supplements, premium"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
