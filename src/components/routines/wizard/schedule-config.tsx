"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";
import {
  presetToCron,
  type SchedulePreset,
  type ScheduleKind,
  WEEKDAY_ORDER,
  formatPresetTime,
  parsePresetTime,
} from "@/lib/routines/schedule-presets";
import { humanCron } from "@/components/routines/types";
import { upcomingRuns, isValidCron } from "@/lib/routines/cron";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

const COMMON_TIMEZONES = [
  "America/Sao_Paulo",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
  "UTC",
];

const WEEKDAY_LABELS: Record<number, { short: string; long: string }> = {
  0: { short: "Sun", long: "Sunday" },
  1: { short: "Mon", long: "Monday" },
  2: { short: "Tue", long: "Tuesday" },
  3: { short: "Wed", long: "Wednesday" },
  4: { short: "Thu", long: "Thursday" },
  5: { short: "Fri", long: "Friday" },
  6: { short: "Sat", long: "Saturday" },
};

interface ScheduleConfigProps {
  preset: SchedulePreset;
  timezone: string;
  onPresetChange: (preset: SchedulePreset) => void;
  onTimezoneChange: (tz: string) => void;
}

export function ScheduleConfig({
  preset,
  timezone,
  onPresetChange,
  onTimezoneChange,
}: ScheduleConfigProps) {
  const locale = useLocale();
  const cron = useMemo(() => presetToCron(preset), [preset]);
  const valid = useMemo(() => isValidCron(cron), [cron]);
  const description = useMemo(() => humanCron(cron, locale), [cron, locale]);
  const upcoming = useMemo(() => {
    if (!valid) return [];
    try {
      return upcomingRuns(cron, timezone, 5);
    } catch {
      return [];
    }
  }, [cron, timezone, valid]);

  function changeKind(kind: ScheduleKind) {
    switch (kind) {
      case "every-minute":
        onPresetChange({ kind: "every-minute" });
        return;
      case "hourly":
        onPresetChange({ kind: "hourly", minute: 0 });
        return;
      case "daily":
        onPresetChange({ kind: "daily", hour: 9, minute: 0 });
        return;
      case "weekly":
        onPresetChange({ kind: "weekly", days: [1], hour: 9, minute: 0 });
        return;
      case "monthly":
        onPresetChange({ kind: "monthly", dayOfMonth: 1, hour: 9, minute: 0 });
        return;
      case "custom":
        onPresetChange({ kind: "custom", expression: cron });
        return;
    }
  }

  return (
    <div className="space-y-4">
      {/* Preset selector */}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["every-minute", "Every minute"],
            ["hourly", "Hourly"],
            ["daily", "Daily"],
            ["weekly", "Weekly"],
            ["monthly", "Monthly"],
            ["custom", "Custom cron"],
          ] as const
        ).map(([kind, label]) => (
          <button
            key={kind}
            type="button"
            onClick={() => changeKind(kind)}
            className={cn(
              "rounded-md border px-3 py-2 text-sm transition-colors",
              preset.kind === kind
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-muted/40"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contextual fields */}
      {preset.kind === "hourly" && (
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Minute of the hour">
            <Input
              type="number"
              min={0}
              max={59}
              value={preset.minute}
              onChange={(e) =>
                onPresetChange({ kind: "hourly", minute: clamp(e.target.value, 0, 59) })
              }
            />
          </FieldGroup>
        </div>
      )}

      {preset.kind === "daily" && (
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Time">
            <Input
              type="time"
              value={formatPresetTime(preset.hour, preset.minute)}
              onChange={(e) => {
                const t = parsePresetTime(e.target.value);
                if (t) onPresetChange({ kind: "daily", ...t });
              }}
            />
          </FieldGroup>
        </div>
      )}

      {preset.kind === "weekly" && (
        <div className="space-y-3">
          <FieldGroup label="Days of week">
            <div className="flex flex-wrap gap-1">
              {WEEKDAY_ORDER.map((d) => {
                const active = preset.days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? preset.days.filter((x) => x !== d)
                        : [...preset.days, d].sort((a, b) => a - b);
                      onPresetChange({ ...preset, days: next });
                    }}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted/40"
                    )}
                  >
                    {WEEKDAY_LABELS[d].short}
                  </button>
                );
              })}
            </div>
          </FieldGroup>
          <FieldGroup label="Time">
            <Input
              type="time"
              value={formatPresetTime(preset.hour, preset.minute)}
              onChange={(e) => {
                const t = parsePresetTime(e.target.value);
                if (t)
                  onPresetChange({
                    kind: "weekly",
                    days: preset.days,
                    ...t,
                  });
              }}
            />
          </FieldGroup>
        </div>
      )}

      {preset.kind === "monthly" && (
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Day of month">
            <Input
              type="number"
              min={1}
              max={31}
              value={preset.dayOfMonth}
              onChange={(e) =>
                onPresetChange({
                  ...preset,
                  dayOfMonth: clamp(e.target.value, 1, 31),
                })
              }
            />
          </FieldGroup>
          <FieldGroup label="Time">
            <Input
              type="time"
              value={formatPresetTime(preset.hour, preset.minute)}
              onChange={(e) => {
                const t = parsePresetTime(e.target.value);
                if (t)
                  onPresetChange({
                    kind: "monthly",
                    dayOfMonth: preset.dayOfMonth,
                    ...t,
                  });
              }}
            />
          </FieldGroup>
        </div>
      )}

      {preset.kind === "custom" && (
        <FieldGroup label="Cron expression">
          <Input
            value={preset.expression}
            onChange={(e) =>
              onPresetChange({ kind: "custom", expression: e.target.value })
            }
            placeholder="0 9 * * 1"
            className="font-mono"
          />
        </FieldGroup>
      )}

      {/* Timezone */}
      <FieldGroup label="Timezone">
        <Select value={timezone} onValueChange={onTimezoneChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {/* Preview */}
      <div className="rounded-md border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{description}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          <code className="rounded bg-background px-1.5 py-0.5 font-mono">{cron}</code>
        </div>
        {upcoming.length > 0 && (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div className="font-medium uppercase tracking-wide text-[10px]">
              Next runs
            </div>
            {upcoming.map((d, i) => (
              <div key={i}>
                {d.toLocaleString(locale, {
                  timeZone: timezone,
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            ))}
          </div>
        )}
        {!valid && (
          <div className="text-xs text-rose-500">Invalid cron expression.</div>
        )}
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function clamp(value: string, min: number, max: number): number {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
