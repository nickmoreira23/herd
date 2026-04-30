"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "CAD", label: "CAD — Canadian Dollar (C$)" },
  { value: "AUD", label: "AUD — Australian Dollar (A$)" },
  { value: "BRL", label: "BRL — Brazilian Real (R$)" },
  { value: "JPY", label: "JPY — Japanese Yen (¥)" },
  { value: "MXN", label: "MXN — Mexican Peso (MX$)" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (Europe)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
];

const NUMBER_FORMATS = [
  { value: "1,234.56", label: "1,234.56 (US/UK)" },
  { value: "1.234,56", label: "1.234,56 (Europe)" },
  { value: "1 234.56", label: "1 234.56 (International)" },
];

const MEASUREMENT_VALUES = ["imperial", "metric"] as const;
type MeasurementValue = (typeof MEASUREMENT_VALUES)[number];

const MEASUREMENT_KEYS = {
  imperial: "organization.regional.measurement.imperial",
  metric: "organization.regional.measurement.metric",
} as const satisfies Record<MeasurementValue, MessageKey>;

interface Props {
  initialSettings: Record<string, string>;
  locale: Locale;
}

export function RegionalSettingsForm({ initialSettings }: Props) {
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
      notifySuccess("organization.feedback.regional_settings_saved", t);
    } finally {
      setSaving(false);
    }
  }, [settings, t]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("organization.regional.title")}
        description={t("organization.regional.description")}
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t("common.states.saving") : t("common.actions.save")}
          </Button>
        }
      />

      <div className="max-w-[800px] mx-auto space-y-6">
        {/* Language & Timezone */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>
              {t("organization.regional.language_section_title")}
            </CardTitle>
            <CardDescription>
              {t("organization.regional.language_section_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>{t("organization.regional.language_label")}</Label>
                <Select
                  value={settings.companyLanguage || "en-US"}
                  onValueChange={(val) => set("companyLanguage", val ?? "en-US")}
                >
                  <SelectTrigger className="mt-2">
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
                <p className="text-xs text-muted-foreground mt-1">
                  {t("organization.regional.language_help")}
                </p>
              </div>
              <div>
                <Label>{t("organization.regional.timezone_label")}</Label>
                <Select
                  value={settings.companyTimezone || "America/New_York"}
                  onValueChange={(val) => set("companyTimezone", val ?? "America/New_York")}
                >
                  <SelectTrigger className="mt-2">
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
                <p className="text-xs text-muted-foreground mt-1">
                  {t("organization.regional.timezone_help")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency & Numbers */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>
              {t("organization.regional.currency_section_title")}
            </CardTitle>
            <CardDescription>
              {t("organization.regional.currency_section_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>{t("organization.regional.currency_label")}</Label>
                <Select
                  value={settings.companyCurrency || "USD"}
                  onValueChange={(val) => set("companyCurrency", val ?? "USD")}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("organization.regional.currency_help")}
                </p>
              </div>
              <div>
                <Label>{t("organization.regional.number_format_label")}</Label>
                <Select
                  value={settings.companyNumberFormat || "1,234.56"}
                  onValueChange={(val) => set("companyNumberFormat", val ?? "1,234.56")}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NUMBER_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formatting */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>
              {t("organization.regional.formatting_section_title")}
            </CardTitle>
            <CardDescription>
              {t("organization.regional.formatting_section_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>{t("organization.regional.date_format_label")}</Label>
                <Select
                  value={settings.companyDateFormat || "MM/DD/YYYY"}
                  onValueChange={(val) => set("companyDateFormat", val ?? "MM/DD/YYYY")}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("organization.regional.measurement_label")}</Label>
                <Select
                  value={settings.companyMeasurement || "imperial"}
                  onValueChange={(val) => set("companyMeasurement", val ?? "imperial")}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEASUREMENT_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(MEASUREMENT_KEYS[value])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("organization.regional.measurement_help")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
