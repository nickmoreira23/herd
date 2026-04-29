"use client";

import { useT } from "@/lib/i18n/locale-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RUN_STATUS_COLOR, type RoutineRunStatus } from "./types";

export interface RoutineRunFull {
  id: string;
  status: RoutineRunStatus;
  triggerSource: string;
  scheduledFor: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  input: unknown;
  output: string | null;
  outputJson: unknown;
  error: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  createdAt: string;
}

interface RoutineRunDetailProps {
  run: RoutineRunFull | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoutineRunDetail({
  run,
  open,
  onOpenChange,
}: RoutineRunDetailProps) {
  const t = useT();
  if (!run) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{t("routines.run.title")}</span>
            <span
              className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${RUN_STATUS_COLOR[run.status]}`}
            >
              {t(`routines.runStatus.${run.status}`)}
            </span>
          </DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <dt>{t("routines.run.trigger")}</dt>
          <dd className="col-span-2">{run.triggerSource}</dd>
          <dt>{t("routines.run.startedAt")}</dt>
          <dd className="col-span-2">{run.startedAt ?? "—"}</dd>
          <dt>{t("routines.run.completedAt")}</dt>
          <dd className="col-span-2">{run.completedAt ?? "—"}</dd>
          <dt>{t("routines.run.duration")}</dt>
          <dd className="col-span-2">
            {run.durationMs != null ? `${run.durationMs} ms` : "—"}
          </dd>
          {(run.promptTokens != null || run.completionTokens != null) && (
            <>
              <dt>{t("routines.run.tokens")}</dt>
              <dd className="col-span-2">
                ↑ {run.promptTokens ?? "—"} · ↓ {run.completionTokens ?? "—"}
              </dd>
            </>
          )}
        </dl>
        <Section title={t("routines.run.input")}>
          <pre className="text-xs bg-muted/40 p-2 rounded overflow-x-auto">
            {JSON.stringify(run.input ?? {}, null, 2)}
          </pre>
        </Section>
        {run.output && (
          <Section title={t("routines.run.output")}>
            <pre className="text-xs whitespace-pre-wrap bg-muted/40 p-2 rounded">
              {run.output}
            </pre>
          </Section>
        )}
        {run.error && (
          <Section title={t("routines.run.error")}>
            <pre className="text-xs whitespace-pre-wrap bg-rose-500/10 text-rose-500 p-2 rounded">
              {run.error}
            </pre>
          </Section>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}
