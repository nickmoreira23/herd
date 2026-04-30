"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

interface ProfileFormProps {
  initialSettings: Record<string, string>;
  locale: Locale;
}

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese (Simplified)" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "AUD", label: "AUD (A$)" },
  { value: "BRL", label: "BRL (R$)" },
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

export function ProfileForm({ initialSettings }: ProfileFormProps) {
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
      notifySuccess("organization.feedback.profile_saved", t);
    } finally {
      setSaving(false);
    }
  }, [settings, t]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("organization.profile.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("organization.profile.description")}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("common.states.saving") : t("common.actions.save")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t("organization.profile.section.general_information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("organization.profile.field.organization_name")}</Label>
              <Input
                value={settings.companyName || ""}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder={t(
                  "organization.profile.field.organization_name_placeholder",
                )}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("organization.profile.field.description_label")}</Label>
              <Textarea
                value={settings.companyDescription || ""}
                onChange={(e) => set("companyDescription", e.target.value)}
                placeholder={t(
                  "organization.profile.field.description_placeholder",
                )}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("organization.profile.field.website")}</Label>
              <Input
                type="url"
                value={settings.companyWebsite || ""}
                onChange={(e) => set("companyWebsite", e.target.value)}
                placeholder={t("organization.profile.field.website_placeholder")}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t("organization.profile.section.contact_information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("organization.profile.field.support_email")}</Label>
              <Input
                type="email"
                value={settings.companySupportEmail || ""}
                onChange={(e) => set("companySupportEmail", e.target.value)}
                placeholder={t(
                  "organization.profile.field.support_email_placeholder",
                )}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("organization.profile.field.phone")}</Label>
              <Input
                value={settings.companyPhone || ""}
                onChange={(e) => set("companyPhone", e.target.value)}
                placeholder={t("organization.profile.field.phone_placeholder")}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("organization.profile.field.address")}</Label>
              <Textarea
                value={settings.companyAddress || ""}
                onChange={(e) => set("companyAddress", e.target.value)}
                placeholder={t("organization.profile.field.address_placeholder")}
                rows={2}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t("organization.profile.section.regional_settings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("organization.profile.field.default_language")}</Label>
              <Select
                value={settings.companyLanguage || "en-US"}
                onValueChange={(val) => set("companyLanguage", val ?? "en-US")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("organization.profile.field.timezone")}</Label>
              <Select
                value={settings.companyTimezone || "America/New_York"}
                onValueChange={(val) => set("companyTimezone", val ?? "America/New_York")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("organization.profile.field.currency")}</Label>
              <Select
                value={settings.companyCurrency || "USD"}
                onValueChange={(val) => set("companyCurrency", val ?? "USD")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t("organization.profile.section.legal")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("organization.profile.field.legal_name")}</Label>
              <Input
                value={settings.companyLegalName || ""}
                onChange={(e) => set("companyLegalName", e.target.value)}
                placeholder={t(
                  "organization.profile.field.legal_name_placeholder",
                )}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("organization.profile.field.tax_id")}</Label>
              <Input
                value={settings.companyTaxId || ""}
                onChange={(e) => set("companyTaxId", e.target.value)}
                placeholder={t("organization.profile.field.tax_id_placeholder")}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
