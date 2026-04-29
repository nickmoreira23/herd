"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Sparkles, Bot, Clock, Bell, Hand } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { useRoutineWizardStore } from "@/stores/routine-wizard-store";
import { presetToCron } from "@/lib/routines/schedule-presets";
import { humanCron } from "@/components/routines/types";

interface StepReviewProps {
  onBack: () => void;
  onSave: (activate: boolean) => void;
  saving: boolean;
}

export function StepReview({ onBack, onSave, saving }: StepReviewProps) {
  const t = useT();
  const locale = useLocale();
  const state = useRoutineWizardStore();
  const cron =
    state.triggerType === "SCHEDULE"
      ? presetToCron(state.schedulePreset)
      : null;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            {t("routines.wizard.steps.review")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("routines.wizard.review.subtitle")}
          </p>
        </div>

        <Section title={t("routines.wizard.review.identity")}>
          <Row label={t("routines.fields.name")} value={state.name} />
          {state.description && (
            <Row
              label={t("routines.fields.description")}
              value={state.description}
            />
          )}
          {state.tags.length > 0 && (
            <Row
              label={t("routines.fields.tags")}
              value={state.tags.join(", ")}
            />
          )}
        </Section>

        <Section
          title={t("routines.wizard.review.trigger")}
          icon={
            state.triggerType === "MANUAL" ? (
              <Hand className="h-4 w-4 text-muted-foreground" />
            ) : state.triggerType === "SCHEDULE" ? (
              <Clock className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Bell className="h-4 w-4 text-muted-foreground" />
            )
          }
        >
          <Row
            label="Type"
            value={t(`routines.trigger.${state.triggerType}`)}
          />
          {state.triggerType === "SCHEDULE" && cron && (
            <>
              <Row label="When" value={humanCron(cron, locale)} />
              <Row label="Timezone" value={state.timezone} />
            </>
          )}
          {state.triggerType === "EVENT" && (
            <Row
              label="Event"
              value={
                state.eventBlock && state.eventType
                  ? `${state.eventBlock}.${state.eventType}`
                  : "—"
              }
            />
          )}
        </Section>

        <Section
          title={t("routines.wizard.review.flow")}
          icon={<Bot className="h-4 w-4 text-muted-foreground" />}
        >
          <Row
            label={t("routines.wizard.review.stepCount")}
            value={String(state.steps.length)}
          />
          <ul className="ml-32 space-y-1 mt-1 text-xs">
            {[...state.steps]
              .sort((a, b) => a.stepOrder - b.stepOrder)
              .map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                    {s.stepOrder}
                  </span>
                  <span className="font-medium">
                    {s.name || `Step ${s.stepOrder}`}
                  </span>
                  {s.agentName && (
                    <span className="text-muted-foreground">· {s.agentName}</span>
                  )}
                </li>
              ))}
          </ul>
        </Section>

        {state.saveError && (
          <div className="text-sm text-rose-500 border border-rose-500/30 rounded p-3">
            {state.saveError}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("routines.wizard.back")}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => onSave(false)}
            disabled={saving}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            {t("routines.wizard.saveDraft")}
          </Button>
          <Button onClick={() => onSave(true)} disabled={saving} className="gap-1">
            <Sparkles className="h-4 w-4" />
            {t("routines.wizard.activate")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border p-4 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          {title}
        </h3>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
