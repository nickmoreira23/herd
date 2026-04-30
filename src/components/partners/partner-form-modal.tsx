"use client";

import { useState, useEffect } from "react";
import type { PartnerBrand, PartnerTierAssignment, SubscriptionTier } from "@/types";
import { KICKBACK_TYPES } from "@/types";
import type { KickbackType } from "@/types";
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
import { useT } from "@/lib/i18n/locale-context";
import type { MessageKey } from "@/lib/i18n/t";

type PartnerWithAssignments = PartnerBrand & {
  tierAssignments: (PartnerTierAssignment & { tier: SubscriptionTier })[];
};

interface PartnerFormModalProps {
  partner?: PartnerWithAssignments | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Record<string, unknown>) => void;
}

const KICKBACK_TYPE_KEYS = {
  NONE: "partner.kickback_type.NONE",
  PERCENT_OF_SALE: "partner.kickback_type.PERCENT_OF_SALE",
  FLAT_PER_REFERRAL: "partner.kickback_type.FLAT_PER_REFERRAL",
  FLAT_PER_MONTH: "partner.kickback_type.FLAT_PER_MONTH",
} as const satisfies Record<KickbackType, MessageKey>;

const PARTNER_CATEGORIES: { value: string; key: MessageKey }[] = [
  { value: "Supplements", key: "partners.form.category.supplements" },
  { value: "Fitness", key: "partners.form.category.fitness" },
  { value: "Apparel", key: "partners.form.category.apparel" },
  { value: "Nutrition", key: "partners.form.category.nutrition" },
  { value: "Recovery", key: "partners.form.category.recovery" },
  { value: "Technology", key: "partners.form.category.technology" },
  { value: "Other", key: "partners.form.category.other" },
];

export function PartnerFormModal({
  partner,
  open,
  onOpenChange,
  onSave,
}: PartnerFormModalProps) {
  const t = useT();
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
            {partner
              ? t("partners.form.edit_title")
              : t("partners.form.new_title")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("partners.form.name")}</Label>
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
              <Label>{t("partners.form.key")}</Label>
              <Input
                required
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder={t("partners.form.key_placeholder")}
                disabled={!!partner}
                className={partner ? "opacity-60" : ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("partners.form.category")}</Label>
              <Select
                value={form.category}
                onValueChange={(val) => setForm({ ...form, category: val ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {t(c.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("partners.form.website_url")}</Label>
              <Input
                type="url"
                placeholder={t("partners.form.url_placeholder")}
                value={form.websiteUrl}
                onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("partners.form.logo_url")}</Label>
              <Input
                type="url"
                placeholder={t("partners.form.url_placeholder")}
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>{t("partners.form.discount_description")}</Label>
            <Textarea
              placeholder={t("partners.form.discount_description_placeholder")}
              value={form.discountDescription}
              onChange={(e) =>
                setForm({ ...form, discountDescription: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("partners.form.kickback_type")}</Label>
              <Select
                value={form.kickbackType}
                onValueChange={(val) => setForm({ ...form, kickbackType: val ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KICKBACK_TYPES.map((kt) => (
                    <SelectItem key={kt} value={kt}>
                      {t(KICKBACK_TYPE_KEYS[kt])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.kickbackType !== "NONE" && (
              <div>
                <Label>
                  {form.kickbackType === "PERCENT_OF_SALE"
                    ? t("partners.form.kickback_percent")
                    : t("partners.form.kickback_amount")}
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
            <Label>{t("partners.form.active")}</Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving
                ? t("common.states.saving")
                : partner
                  ? t("partners.form.update")
                  : t("partners.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
