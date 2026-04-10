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
import { toast } from "sonner";
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
  { value: "EUR", label: "EUR — Euro (\u20ac)" },
  { value: "GBP", label: "GBP — British Pound (\u00a3)" },
  { value: "CAD", label: "CAD — Canadian Dollar (C$)" },
  { value: "AUD", label: "AUD — Australian Dollar (A$)" },
  { value: "BRL", label: "BRL — Brazilian Real (R$)" },
  { value: "JPY", label: "JPY — Japanese Yen (\u00a5)" },
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

const MEASUREMENT_SYSTEMS = [
  { value: "imperial", label: "Imperial (lb, oz, in)" },
  { value: "metric", label: "Metric (kg, g, cm)" },
];

interface Props {
  initialSettings: Record<string, string>;
}

export function RegionalSettingsForm({ initialSettings }: Props) {
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
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      toast.success("Regional settings saved");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regional Settings"
        description="Configure language, timezone, currency, and formatting preferences for your organization."
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <div className="max-w-[800px] mx-auto space-y-6">
        {/* Language & Timezone */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Language & Timezone</CardTitle>
            <CardDescription>
              Primary language and timezone used across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Default Language</Label>
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
                  Primary language used across the platform and communications.
                </p>
              </div>
              <div>
                <Label>Timezone</Label>
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
                  Used for scheduling, reporting, and displaying times across the platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency & Numbers */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Currency & Numbers</CardTitle>
            <CardDescription>
              Default currency and number formatting for commissions, payouts, and pricing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Primary Currency</Label>
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
                  Default currency for commissions, payouts, and product pricing.
                </p>
              </div>
              <div>
                <Label>Number Format</Label>
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
            <CardTitle>Formatting</CardTitle>
            <CardDescription>
              Date display and measurement system preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Date Format</Label>
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
                <Label>Measurement System</Label>
                <Select
                  value={settings.companyMeasurement || "imperial"}
                  onValueChange={(val) => set("companyMeasurement", val ?? "imperial")}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEASUREMENT_SYSTEMS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Used for product weights, shipping dimensions, and related calculations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
