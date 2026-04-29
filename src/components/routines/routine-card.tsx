"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  STATUS_COLOR,
  TRIGGER_EMOJI,
  RUN_STATUS_COLOR,
  humanCron,
  type RoutineRow,
} from "./types";

export function RoutineCard({ routine }: { routine: RoutineRow }) {
  const t = useT();
  const locale = useLocale();

  let triggerLine: string;
  if (routine.triggerType === "MANUAL") {
    triggerLine = t("routines.trigger.MANUAL");
  } else if (routine.triggerType === "SCHEDULE") {
    triggerLine = humanCron(routine.cronExpression, locale);
  } else {
    triggerLine = `${routine.eventBlock ?? "—"}.${routine.eventType ?? "—"}`;
  }

  return (
    <Link href={`/admin/blocks/routines/${routine.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="py-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold truncate flex-1">
              {routine.name}
            </h3>
            <span
              className={`shrink-0 text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${STATUS_COLOR[routine.status]}`}
            >
              {t(`routines.status.${routine.status}`)}
            </span>
          </div>

          {routine.agent && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bot className="h-3 w-3 shrink-0" />
              <span className="truncate">{routine.agent.name}</span>
            </div>
          )}

          <div className="text-xs text-muted-foreground truncate">
            {TRIGGER_EMOJI[routine.triggerType]} {triggerLine}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>
              {t("routines.runCount", { count: routine.runCount })}
            </span>
            {routine.lastRunStatus && (
              <span
                className={`text-[10px] uppercase tracking-wide rounded px-1 py-0.5 ${RUN_STATUS_COLOR[routine.lastRunStatus]}`}
              >
                {t(`routines.runStatus.${routine.lastRunStatus}`)}
              </span>
            )}
          </div>

          {routine.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {routine.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
