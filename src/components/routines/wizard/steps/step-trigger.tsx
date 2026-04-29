"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import {
  useRoutineWizardStore,
  type TriggerType,
} from "@/stores/routine-wizard-store";
import { ScheduleConfig } from "../schedule-config";
import { EventConfig } from "../event-config";
import { InfoTip } from "@/components/tiers/info-tip";
import { cn } from "@/lib/utils";

interface StepTriggerProps {
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

const TRIGGER_OPTIONS: {
  type: TriggerType;
  emoji: string;
  titleKey: string;
  descKey: string;
  tipKey: string;
}[] = [
  {
    type: "MANUAL",
    emoji: "👆",
    titleKey: "routines.trigger.MANUAL",
    descKey: "routines.wizard.trigger.manualHelp",
    tipKey: "routines.tooltip.triggerManual",
  },
  {
    type: "SCHEDULE",
    emoji: "⏰",
    titleKey: "routines.trigger.SCHEDULE",
    descKey: "routines.wizard.trigger.scheduleHelp",
    tipKey: "routines.tooltip.triggerSchedule",
  },
  {
    type: "EVENT",
    emoji: "🔔",
    titleKey: "routines.trigger.EVENT",
    descKey: "routines.wizard.trigger.eventHelp",
    tipKey: "routines.tooltip.triggerEvent",
  },
];

export function StepTrigger({ onNext, onBack, canProceed }: StepTriggerProps) {
  const t = useT();
  const {
    triggerType,
    setTriggerType,
    schedulePreset,
    setSchedulePreset,
    timezone,
    setTimezone,
    eventBlock,
    eventType,
    setEvent,
  } = useRoutineWizardStore();

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">
            {t("routines.wizard.steps.trigger")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("routines.wizard.trigger.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TRIGGER_OPTIONS.map((opt) => {
            const active = triggerType === opt.type;
            return (
              <div
                key={opt.type}
                role="button"
                aria-pressed={active}
                tabIndex={0}
                onClick={() => setTriggerType(opt.type)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setTriggerType(opt.type);
                  }
                }}
                className={cn(
                  "rounded-lg border p-4 text-left transition-all relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary",
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-foreground/30 hover:bg-muted/40"
                )}
              >
                <div className="text-2xl mb-2">{opt.emoji}</div>
                <div className="text-sm font-semibold flex items-center">
                  {t(opt.titleKey as never)}
                  <InfoTip text={t(opt.tipKey as never)} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(opt.descKey as never)}
                </p>
              </div>
            );
          })}
        </div>

        {triggerType === "MANUAL" && (
          <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            {t("routines.wizard.trigger.manualNote")}
          </div>
        )}

        {triggerType === "SCHEDULE" && (
          <ScheduleConfig
            preset={schedulePreset}
            timezone={timezone}
            onPresetChange={setSchedulePreset}
            onTimezoneChange={setTimezone}
          />
        )}

        {triggerType === "EVENT" && (
          <EventConfig block={eventBlock} type={eventType} onChange={setEvent} />
        )}
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("routines.wizard.back")}
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          {t("routines.wizard.next")}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
