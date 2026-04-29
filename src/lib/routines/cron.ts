import { CronExpressionParser } from "cron-parser";

/** Parse a cron expression and return the next firing date in the given timezone. */
export function nextRunAt(
  cron: string,
  tz: string,
  from: Date = new Date()
): Date {
  const interval = CronExpressionParser.parse(cron, {
    currentDate: from,
    tz,
  });
  return interval.next().toDate();
}

/** Return the next N firing dates for a cron expression. */
export function upcomingRuns(
  cron: string,
  tz: string,
  count = 3,
  from: Date = new Date()
): Date[] {
  const interval = CronExpressionParser.parse(cron, {
    currentDate: from,
    tz,
  });
  const out: Date[] = [];
  for (let i = 0; i < count; i++) out.push(interval.next().toDate());
  return out;
}

/** True if the cron expression is syntactically valid. */
export function isValidCron(expr: string): boolean {
  try {
    CronExpressionParser.parse(expr);
    return true;
  } catch {
    return false;
  }
}
