/**
 * Friendly schedule presets that map to/from cron expressions.
 *
 * The wizard exposes presets so the admin never has to type a cron string
 * directly; the detail page uses `cronToPreset` to round-trip a saved cron
 * back into the same UI controls.
 */

export type SchedulePreset =
  | { kind: "every-minute" }
  | { kind: "hourly"; minute: number } // minute of the hour (0-59)
  | { kind: "daily"; hour: number; minute: number }
  | {
      kind: "weekly";
      days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat (POSIX)
      hour: number;
      minute: number;
    }
  | { kind: "monthly"; dayOfMonth: number; hour: number; minute: number }
  | { kind: "custom"; expression: string };

export type ScheduleKind = SchedulePreset["kind"];

export const SCHEDULE_KINDS: ScheduleKind[] = [
  "every-minute",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "custom",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** Convert a preset into a 5-field cron expression. */
export function presetToCron(preset: SchedulePreset): string {
  switch (preset.kind) {
    case "every-minute":
      return "* * * * *";
    case "hourly":
      return `${preset.minute} * * * *`;
    case "daily":
      return `${preset.minute} ${preset.hour} * * *`;
    case "weekly": {
      const days = [...new Set(preset.days)].sort((a, b) => a - b);
      const dow = days.length ? days.join(",") : "*";
      return `${preset.minute} ${preset.hour} * * ${dow}`;
    }
    case "monthly":
      return `${preset.minute} ${preset.hour} ${preset.dayOfMonth} * *`;
    case "custom":
      return preset.expression;
  }
}

/**
 * Best-effort parse of a 5-field cron back into a preset. Falls back to
 * `{ kind: "custom", expression }` for anything we can't recognise.
 *
 * Recognises:
 *  - `* * * * *` → every-minute
 *  - `M * * * *` (M numeric 0-59) → hourly
 *  - `M H * * *` → daily
 *  - `M H * * D[,D...]` (D numeric 0-6) → weekly
 *  - `M H N * *` (N numeric 1-31) → monthly
 */
export function cronToPreset(expr: string): SchedulePreset {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return { kind: "custom", expression: expr };
  const [m, h, dom, mon, dow] = fields;

  const numeric = /^\d+$/;
  const star = (s: string) => s === "*";
  const allStar = mon === "*" ? true : false;

  if (!allStar) return { kind: "custom", expression: expr };

  // Every minute
  if (star(m) && star(h) && star(dom) && star(dow)) {
    return { kind: "every-minute" };
  }

  // Hourly
  if (numeric.test(m) && star(h) && star(dom) && star(dow)) {
    return { kind: "hourly", minute: Number(m) };
  }

  // Daily
  if (numeric.test(m) && numeric.test(h) && star(dom) && star(dow)) {
    return { kind: "daily", hour: Number(h), minute: Number(m) };
  }

  // Weekly: day-of-month is *, day-of-week is digits or comma list
  if (
    numeric.test(m) &&
    numeric.test(h) &&
    star(dom) &&
    /^\d+(,\d+)*$/.test(dow)
  ) {
    return {
      kind: "weekly",
      hour: Number(h),
      minute: Number(m),
      days: dow.split(",").map((d) => Number(d)),
    };
  }

  // Monthly: day-of-month numeric, day-of-week *
  if (
    numeric.test(m) &&
    numeric.test(h) &&
    numeric.test(dom) &&
    star(dow)
  ) {
    return {
      kind: "monthly",
      dayOfMonth: Number(dom),
      hour: Number(h),
      minute: Number(m),
    };
  }

  return { kind: "custom", expression: expr };
}

/** Format a HH:MM string for a daily/weekly/monthly preset's time fields. */
export function formatPresetTime(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

/** Parse "HH:MM" into { hour, minute }; returns null if malformed. */
export function parsePresetTime(
  text: string
): { hour: number; minute: number } | null {
  const m = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return { hour: h, minute: mm };
}

/** ISO order Sunday..Saturday for week-day pickers. */
export const WEEKDAY_ORDER = [0, 1, 2, 3, 4, 5, 6] as const;
