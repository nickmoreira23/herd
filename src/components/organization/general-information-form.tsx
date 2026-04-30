"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/t";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import { PageHeader } from "@/components/layout/page-header";

const INDUSTRY_VALUES = [
  "health-wellness",
  "supplements",
  "fitness",
  "ecommerce",
  "saas",
  "retail",
  "food-beverage",
  "beauty",
  "other",
] as const;
type IndustryValue = (typeof INDUSTRY_VALUES)[number];

const INDUSTRY_KEYS = {
  "health-wellness": "organization.industry.health_wellness",
  supplements: "organization.industry.supplements",
  fitness: "organization.industry.fitness",
  ecommerce: "organization.industry.ecommerce",
  saas: "organization.industry.saas",
  retail: "organization.industry.retail",
  "food-beverage": "organization.industry.food_beverage",
  beauty: "organization.industry.beauty",
  other: "organization.industry.other",
} as const satisfies Record<IndustryValue, MessageKey>;

const COMPANY_SIZE_VALUES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const;
type CompanySizeValue = (typeof COMPANY_SIZE_VALUES)[number];

const COMPANY_SIZE_KEYS = {
  "1-10": "organization.size.1_10",
  "11-50": "organization.size.11_50",
  "51-200": "organization.size.51_200",
  "201-500": "organization.size.201_500",
  "501-1000": "organization.size.501_1000",
  "1000+": "organization.size.1000_plus",
} as const satisfies Record<CompanySizeValue, MessageKey>;

interface Props {
  initialSettings: Record<string, string>;
  locale: Locale;
}

export function GeneralInformationForm({ initialSettings }: Props) {
  const t = useT();
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const set = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        notifyError("error.organization.save_failed", t);
        return;
      }
      notifySuccess("organization.feedback.general_information_saved", t);
    } finally {
      setSaving(false);
    }
  }, [settings, t]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("organization.profile.general.title")}
        description={t("organization.profile.general.description")}
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t("common.states.saving") : t("common.actions.save")}
          </Button>
        }
      />

      <div className="max-w-[800px] mx-auto space-y-6">
        {/* Organization Identity */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>
              {t("organization.profile.general.identity_title")}
            </CardTitle>
            <CardDescription>
              {t("organization.profile.general.identity_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>
                  {t("organization.profile.field.organization_name")}
                </Label>
                <Input
                  value={settings.companyName || ""}
                  onChange={(e) => set("companyName", e.target.value)}
                  placeholder={t(
                    "organization.profile.general.org_name_placeholder",
                  )}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("organization.profile.field.legal_name")}</Label>
                <Input
                  value={settings.companyLegalName || ""}
                  onChange={(e) => set("companyLegalName", e.target.value)}
                  placeholder={t(
                    "organization.profile.field.legal_name_placeholder",
                  )}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("organization.profile.general.legal_name_help")}
                </p>
              </div>
              <div>
                <Label>{t("organization.profile.field.tax_id")}</Label>
                <Input
                  value={settings.companyTaxId || ""}
                  onChange={(e) => set("companyTaxId", e.target.value)}
                  placeholder={t(
                    "organization.profile.field.tax_id_placeholder",
                  )}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{t("organization.profile.general.about_title")}</CardTitle>
            <CardDescription>
              {t("organization.profile.general.about_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>{t("organization.profile.field.description_label")}</Label>
                <Textarea
                  value={settings.companyDescription || ""}
                  onChange={(e) => set("companyDescription", e.target.value)}
                  placeholder={t(
                    "organization.profile.general.description_placeholder",
                  )}
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>
                  {t("organization.profile.general.mission_label")}
                </Label>
                <Textarea
                  value={settings.companyMission || ""}
                  onChange={(e) => set("companyMission", e.target.value)}
                  placeholder={t(
                    "organization.profile.general.mission_placeholder",
                  )}
                  rows={2}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("organization.profile.field.website")}</Label>
                <Input
                  type="url"
                  value={settings.companyWebsite || ""}
                  onChange={(e) => set("companyWebsite", e.target.value)}
                  placeholder={t(
                    "organization.profile.field.website_placeholder",
                  )}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>
              {t("organization.profile.general.details_title")}
            </CardTitle>
            <CardDescription>
              {t("organization.profile.general.details_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>
                  {t("organization.profile.general.industry_label")}
                </Label>
                <Select
                  value={settings.companyIndustry || ""}
                  onValueChange={(val) => set("companyIndustry", val ?? "")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={t(
                        "organization.profile.general.industry_placeholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(INDUSTRY_KEYS[value])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("organization.profile.general.size_label")}</Label>
                <Select
                  value={settings.companySize || ""}
                  onValueChange={(val) => set("companySize", val ?? "")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={t(
                        "organization.profile.general.size_placeholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZE_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(COMPANY_SIZE_KEYS[value])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {t("organization.profile.general.founded_label")}
                </Label>
                <Input
                  value={settings.companyFounded || ""}
                  onChange={(e) => set("companyFounded", e.target.value)}
                  placeholder={t(
                    "organization.profile.general.founded_placeholder",
                  )}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
