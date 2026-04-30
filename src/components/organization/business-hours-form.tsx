"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
type DayKey = (typeof DAY_KEYS)[number];

const DAY_LABEL_KEYS = {
  monday: "organization.business_hours.day.monday",
  tuesday: "organization.business_hours.day.tuesday",
  wednesday: "organization.business_hours.day.wednesday",
  thursday: "organization.business_hours.day.thursday",
  friday: "organization.business_hours.day.friday",
  saturday: "organization.business_hours.day.saturday",
  sunday: "organization.business_hours.day.sunday",
} as const satisfies Record<DayKey, MessageKey>;

const RESPONSE_VALUES = ["1h", "4h", "8h", "24h", "48h"] as const;
type ResponseValue = (typeof RESPONSE_VALUES)[number];

const RESPONSE_KEYS = {
  "1h": "organization.business_hours.response.1h",
  "4h": "organization.business_hours.response.4h",
  "8h": "organization.business_hours.response.8h",
  "24h": "organization.business_hours.response.24h",
  "48h": "organization.business_hours.response.48h",
} as const satisfies Record<ResponseValue, MessageKey>;

interface Props {
  initialSettings: Record<string, string>;
  locale: Locale;
}

export function BusinessHoursForm({ initialSettings }: Props) {
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
      notifySuccess("organization.feedback.business_hours_saved", t);
    } finally {
      setSaving(false);
    }
  }, [settings, t]);

  const isDayOpen = (day: string) => settings[`hours_${day}_open`] !== "false";

  const toggleDay = (day: string) => {
    set(`hours_${day}_open`, isDayOpen(day) ? "false" : "true");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("organization.business_hours.title")}
        description={t("organization.business_hours.description")}
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t("common.states.saving") : t("common.actions.save")}
          </Button>
        }
      />

      <div className="max-w-[800px] mx-auto space-y-6">
        {/* Weekly Schedule */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>
              {t("organization.business_hours.weekly_title")}
            </CardTitle>
            <CardDescription>
              {t("organization.business_hours.weekly_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DAY_KEYS.map((day) => {
                const open = isDayOpen(day);
                return (
                  <div
                    key={day}
                    className="flex items-center gap-4 rounded-lg border border-border px-4 py-3"
                  >
                    <div className="w-28 shrink-0">
                      <span className="text-sm font-medium">
                        {t(DAY_LABEL_KEYS[day])}
                      </span>
                    </div>
                    <Switch
                      checked={open}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    {open ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={settings[`hours_${day}_start`] || "09:00"}
                          onChange={(e) =>
                            set(`hours_${day}_start`, e.target.value)
                          }
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">
                          {t("organization.business_hours.to")}
                        </span>
                        <Input
                          type="time"
                          value={settings[`hours_${day}_end`] || "17:00"}
                          onChange={(e) =>
                            set(`hours_${day}_end`, e.target.value)
                          }
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {t("organization.business_hours.closed")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Support Availability */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>
              {t("organization.business_hours.support_title")}
            </CardTitle>
            <CardDescription>
              {t("organization.business_hours.support_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>
                  {t("organization.business_hours.response_label")}
                </Label>
                <Select
                  value={settings.supportResponseTime || "24h"}
                  onValueChange={(val) => set("supportResponseTime", val ?? "24h")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(RESPONSE_KEYS[value])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("organization.business_hours.response_help")}
                </p>
              </div>
              <div>
                <Label>
                  {t("organization.business_hours.holiday_label")}
                </Label>
                <Input
                  value={settings.holidayNotice || ""}
                  onChange={(e) => set("holidayNotice", e.target.value)}
                  placeholder={t(
                    "organization.business_hours.holiday_placeholder",
                  )}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("organization.business_hours.holiday_help")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
