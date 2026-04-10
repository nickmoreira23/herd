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
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

interface Props {
  initialSettings: Record<string, string>;
}

export function BusinessHoursForm({ initialSettings }: Props) {
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
      toast.success("Business hours saved");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const isDayOpen = (day: string) => settings[`hours_${day}_open`] !== "false";

  const toggleDay = (day: string) => {
    set(`hours_${day}_open`, isDayOpen(day) ? "false" : "true");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Hours"
        description="Set your organization's operating hours. These are displayed to partners and customers."
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <div className="max-w-[800px] mx-auto space-y-6">
        {/* Weekly Schedule */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>
              Toggle each day on or off and set the operating hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DAYS.map((day) => {
                const open = isDayOpen(day.key);
                return (
                  <div
                    key={day.key}
                    className="flex items-center gap-4 rounded-lg border border-border px-4 py-3"
                  >
                    <div className="w-28 shrink-0">
                      <span className="text-sm font-medium">{day.label}</span>
                    </div>
                    <Switch
                      checked={open}
                      onCheckedChange={() => toggleDay(day.key)}
                    />
                    {open ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={settings[`hours_${day.key}_start`] || "09:00"}
                          onChange={(e) =>
                            set(`hours_${day.key}_start`, e.target.value)
                          }
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={settings[`hours_${day.key}_end`] || "17:00"}
                          onChange={(e) =>
                            set(`hours_${day.key}_end`, e.target.value)
                          }
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Closed</span>
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
            <CardTitle>Support Availability</CardTitle>
            <CardDescription>
              Response time expectations and holiday schedule information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Support Response Time</Label>
                <Select
                  value={settings.supportResponseTime || "24h"}
                  onValueChange={(val) => set("supportResponseTime", val ?? "24h")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Within 1 hour</SelectItem>
                    <SelectItem value="4h">Within 4 hours</SelectItem>
                    <SelectItem value="8h">Within 8 hours</SelectItem>
                    <SelectItem value="24h">Within 24 hours</SelectItem>
                    <SelectItem value="48h">Within 48 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected response time displayed to partners and customers.
                </p>
              </div>
              <div>
                <Label>Holiday Closure Notice</Label>
                <Input
                  value={settings.holidayNotice || ""}
                  onChange={(e) => set("holidayNotice", e.target.value)}
                  placeholder="e.g. Closed on all major US holidays"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A brief note about holiday schedules shown to partners.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
