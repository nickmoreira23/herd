"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { useMeetingPrepStore } from "@/stores/meeting-prep-store";
import {
  MEETING_TYPES,
  TONE_TAGS,
  type MeetingType,
  type ToneTag,
  type ValidationResult,
} from "@/lib/meeting-prep/types";
import {
  suggestObjective,
  summarizeContext,
  validateContext,
} from "@/lib/meeting-prep/mock-llm";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import { cn } from "@/lib/utils";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import { ParticipantRow } from "./participant-row";

interface BriefingWizardProps {
  sessionId: string;
}

type SectionKey =
  | "identification"
  | "objective"
  | "participants"
  | "outcome"
  | "context";

const SECTIONS: SectionKey[] = [
  "identification",
  "objective",
  "participants",
  "outcome",
  "context",
];

export function BriefingWizard({ sessionId }: BriefingWizardProps) {
  const t = useT();
  const router = useRouter();

  // Hydration guard — Zustand persist hydrates on the client, so on first
  // render the store is empty and any UI keyed off the session would flash
  // an empty state. Render skeletons until hydration completes.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const session = useMeetingPrepStore((s) => s.sessions[sessionId]);
  const updateContext = useMeetingPrepStore((s) => s.updateContext);
  const setStatus = useMeetingPrepStore((s) => s.setStatus);
  const setSummary = useMeetingPrepStore((s) => s.setSummary);
  const addParticipant = useMeetingPrepStore((s) => s.addParticipant);
  const updateParticipant = useMeetingPrepStore((s) => s.updateParticipant);
  const removeParticipant = useMeetingPrepStore((s) => s.removeParticipant);
  const toggleToneTag = useMeetingPrepStore((s) => s.toggleToneTag);

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(
    {
      identification: true,
      objective: true,
      participants: true,
      outcome: true,
      context: true,
    },
  );
  const toggleSection = (key: SectionKey) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Auto-save indicator — Zustand persist already writes to localStorage on
  // every set; we just surface a "Saving…" pulse so the user trusts it.
  const [savingPulse, setSavingPulse] = useState(false);
  const lastUpdateRef = useRef<string | null>(null);
  useEffect(() => {
    if (!session) return;
    if (lastUpdateRef.current === session.updatedAt) return;
    lastUpdateRef.current = session.updatedAt;
    setSavingPulse(true);
    const id = setTimeout(() => setSavingPulse(false), 800);
    return () => clearTimeout(id);
  }, [session]);

  // Suggestions
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);

  // Validation
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  // Filled-section count for progress label
  const filledCount = useMemo(() => {
    if (!session) return 0;
    const c = session.context;
    let n = 0;
    if (c.title.trim() && c.meetingType) n++;
    if (c.objective.trim()) n++;
    if (c.participants.length > 0 && c.participants.some((p) => p.name.trim()))
      n++;
    if (c.desiredOutcome.trim()) n++;
    if (c.historyNotes.trim() || c.constraints.trim() || c.toneTags.length > 0)
      n++;
    return n;
  }, [session]);

  if (!hydrated) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-1/3 rounded bg-muted animate-pulse" />
        <div className="h-32 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4 p-6">
        <PageHeader
          crumbs={[
            { label: t("meeting_prep.briefing.crumb"), href: "/admin/tools" },
            {
              label: t("meeting_prep.tool.name"),
              href: "/admin/tools/meeting-prep",
            },
          ]}
          title={t("error.meeting_prep.session_not_found")}
        />
        <Button
          variant="outline"
          onClick={() => router.push("/admin/tools/meeting-prep")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("meeting_prep.actions.back_to_list")}
        </Button>
      </div>
    );
  }

  const ctx = session.context;
  const objectivePlaceholderKey = ctx.meetingType
    ? (`meeting_prep.field.objective_placeholder.${ctx.meetingType}` as MessageKey)
    : ("meeting_prep.field.objective_placeholder.default" as MessageKey);

  const handleSuggest = async () => {
    setSuggestLoading(true);
    setSuggestions(null);
    try {
      const out = await suggestObjective({
        title: ctx.title,
        meetingType: ctx.meetingType,
        participants: ctx.participants,
      });
      setSuggestions(out);
    } catch {
      notifyError("error.meeting_prep.suggest_failed", t);
    } finally {
      setSuggestLoading(false);
    }
  };

  const goToSpecialists = () =>
    router.push(`/admin/tools/meeting-prep/${sessionId}/specialists`);

  const handleValidate = async () => {
    setValidating(true);
    try {
      const result = await validateContext(ctx);
      setValidation(result);
      if (result.ok) {
        await regenerateSummary();
        setStatus(sessionId, "briefed");
        notifySuccess("meeting_prep.feedback.briefed", t);
        goToSpecialists();
      }
    } catch {
      notifyError("error.meeting_prep.validate_failed", t);
    } finally {
      setValidating(false);
    }
  };

  const handleContinueAnyway = async () => {
    await regenerateSummary();
    setStatus(sessionId, "briefed");
    notifySuccess("meeting_prep.feedback.briefed", t);
    goToSpecialists();
  };

  const regenerateSummary = async () => {
    setSummarizing(true);
    try {
      const summary = await summarizeContext(ctx);
      setSummary(sessionId, summary);
    } finally {
      setSummarizing(false);
    }
  };

  const handleSaveDraft = () => {
    notifySuccess("meeting_prep.feedback.draft_saved", t);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        crumbs={[
          { label: t("meeting_prep.briefing.crumb"), href: "/admin/tools" },
          {
            label: t("meeting_prep.tool.name"),
            href: "/admin/tools/meeting-prep",
          },
        ]}
        title={
          ctx.title.trim() ||
          t("meeting_prep.briefing.title")
        }
        description={t("meeting_prep.briefing.description")}
        action={
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("meeting_prep.briefing.progress", {
                filled: filledCount,
                total: SECTIONS.length,
              })}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs",
                savingPulse ? "text-muted-foreground" : "text-emerald-600",
              )}
            >
              {savingPulse ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("meeting_prep.briefing.autosave_pending")}
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  {t("meeting_prep.briefing.autosave_idle")}
                </>
              )}
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 px-4">
        {/* Left: sections */}
        <div className="space-y-4 min-w-0">
          {/* 1. Identification */}
          <SectionShell
            open={openSections.identification}
            onToggle={() => toggleSection("identification")}
            title={t("meeting_prep.briefing.section.identification")}
            help={t("meeting_prep.briefing.section.identification_help")}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="mp-title">
                  {t("meeting_prep.field.title")}
                </Label>
                <Input
                  id="mp-title"
                  value={ctx.title}
                  onChange={(e) =>
                    updateContext(sessionId, { title: e.target.value })
                  }
                  placeholder={t("meeting_prep.field.title_placeholder")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mp-type">
                    {t("meeting_prep.field.meeting_type")}
                  </Label>
                  <Select
                    value={ctx.meetingType ?? ""}
                    onValueChange={(v) =>
                      updateContext(sessionId, {
                        meetingType: v as MeetingType,
                      })
                    }
                  >
                    <SelectTrigger id="mp-type">
                      <SelectValue
                        placeholder={t(
                          "meeting_prep.field.meeting_type_placeholder",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {MEETING_TYPES.map((mt) => (
                        <SelectItem key={mt} value={mt}>
                          {t(`meeting_prep.meeting_type.${mt}` as MessageKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mp-scheduled">
                    {t("meeting_prep.field.scheduled_at")}{" "}
                    <span className="text-muted-foreground text-xs font-normal">
                      ({t("meeting_prep.briefing.optional")})
                    </span>
                  </Label>
                  <Input
                    id="mp-scheduled"
                    type="datetime-local"
                    value={ctx.scheduledAt ?? ""}
                    onChange={(e) =>
                      updateContext(sessionId, {
                        scheduledAt: e.target.value || null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mp-duration">
                    {t("meeting_prep.field.duration")}
                  </Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t("meeting_prep.field.duration_value", {
                      minutes: ctx.durationMin,
                    })}
                  </span>
                </div>
                <Slider
                  id="mp-duration"
                  min={15}
                  max={180}
                  step={15}
                  value={[ctx.durationMin]}
                  onValueChange={(v) => {
                    // base-ui's Slider passes a number for single-thumb sliders,
                    // an array when there are multiple thumbs. Normalize.
                    const next = Array.isArray(v) ? v[0] : v;
                    if (typeof next === "number")
                      updateContext(sessionId, { durationMin: next });
                  }}
                />
              </div>
            </div>
          </SectionShell>

          {/* 2. Objective */}
          <SectionShell
            open={openSections.objective}
            onToggle={() => toggleSection("objective")}
            title={t("meeting_prep.briefing.section.objective")}
            help={t("meeting_prep.briefing.section.objective_help")}
            highlight
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mp-objective">
                    {t("meeting_prep.field.objective")}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSuggest}
                    disabled={suggestLoading}
                    className="text-violet-600 hover:text-violet-700"
                  >
                    {suggestLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        {t(
                          "meeting_prep.field.suggest_objectives_loading",
                        )}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        {t("meeting_prep.field.suggest_objectives")}
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="mp-objective"
                  rows={3}
                  value={ctx.objective}
                  onChange={(e) =>
                    updateContext(sessionId, { objective: e.target.value })
                  }
                  placeholder={t(objectivePlaceholderKey)}
                />
              </div>

              {suggestions && (
                <div className="rounded-lg border border-violet-200 dark:border-violet-900 bg-violet-50/60 dark:bg-violet-950/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      {t("meeting_prep.field.suggest_objectives")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSuggestions(null)}
                      className="h-6 px-1.5 text-muted-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-md bg-background/60 p-2"
                      >
                        <p className="flex-1 text-sm leading-snug">{s}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-violet-600 hover:text-violet-700"
                          onClick={() => {
                            updateContext(sessionId, { objective: s });
                            setSuggestions(null);
                          }}
                        >
                          {t(
                            "meeting_prep.field.suggest_objectives_use",
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionShell>

          {/* 3. Participants */}
          <SectionShell
            open={openSections.participants}
            onToggle={() => toggleSection("participants")}
            title={t("meeting_prep.briefing.section.participants")}
            help={t("meeting_prep.briefing.section.participants_help")}
          >
            <div className="space-y-3">
              {ctx.participants.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {t("meeting_prep.participants.empty")}
                </div>
              ) : (
                <div className="space-y-3">
                  {ctx.participants.map((p, i) => (
                    <ParticipantRow
                      key={p.id}
                      index={i}
                      participant={p}
                      onChange={(patch) =>
                        updateParticipant(sessionId, p.id, patch)
                      }
                      onRemove={() => removeParticipant(sessionId, p.id)}
                    />
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => addParticipant(sessionId)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {t("meeting_prep.participants.add")}
              </Button>
            </div>
          </SectionShell>

          {/* 4. Outcome */}
          <SectionShell
            open={openSections.outcome}
            onToggle={() => toggleSection("outcome")}
            title={t("meeting_prep.briefing.section.outcome")}
            help={t("meeting_prep.briefing.section.outcome_help")}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="mp-outcome">
                  {t("meeting_prep.field.desired_outcome")}
                </Label>
                <Textarea
                  id="mp-outcome"
                  rows={3}
                  value={ctx.desiredOutcome}
                  onChange={(e) =>
                    updateContext(sessionId, {
                      desiredOutcome: e.target.value,
                    })
                  }
                  placeholder={t(
                    "meeting_prep.field.desired_outcome_placeholder",
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mp-batna">
                  {t("meeting_prep.field.batna")}{" "}
                  <span className="text-muted-foreground text-xs font-normal">
                    ({t("meeting_prep.briefing.recommended")})
                  </span>
                </Label>
                <Textarea
                  id="mp-batna"
                  rows={2}
                  value={ctx.batna}
                  onChange={(e) =>
                    updateContext(sessionId, { batna: e.target.value })
                  }
                  placeholder={t("meeting_prep.field.batna_placeholder")}
                />
              </div>
            </div>
          </SectionShell>

          {/* 5. Context */}
          <SectionShell
            open={openSections.context}
            onToggle={() => toggleSection("context")}
            title={t("meeting_prep.briefing.section.context")}
            help={t("meeting_prep.briefing.section.context_help")}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="mp-history">
                  {t("meeting_prep.field.history")}{" "}
                  <span className="text-muted-foreground text-xs font-normal">
                    ({t("meeting_prep.briefing.optional")})
                  </span>
                </Label>
                <Textarea
                  id="mp-history"
                  rows={3}
                  value={ctx.historyNotes}
                  onChange={(e) =>
                    updateContext(sessionId, { historyNotes: e.target.value })
                  }
                  placeholder={t("meeting_prep.field.history_placeholder")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mp-constraints">
                  {t("meeting_prep.field.constraints")}{" "}
                  <span className="text-muted-foreground text-xs font-normal">
                    ({t("meeting_prep.briefing.optional")})
                  </span>
                </Label>
                <Textarea
                  id="mp-constraints"
                  rows={2}
                  value={ctx.constraints}
                  onChange={(e) =>
                    updateContext(sessionId, { constraints: e.target.value })
                  }
                  placeholder={t("meeting_prep.field.constraints_placeholder")}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("meeting_prep.field.tone_tags")}</Label>
                <div className="flex flex-wrap gap-2">
                  {TONE_TAGS.map((tag) => {
                    const active = ctx.toneTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleToneTag(sessionId, tag)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                          active
                            ? "bg-violet-600 border-violet-600 text-white"
                            : "bg-background border-border text-muted-foreground hover:border-violet-600/40 hover:text-foreground",
                        )}
                        aria-pressed={active}
                      >
                        {t(`meeting_prep.tone.${tag}` as MessageKey)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </SectionShell>

          {/* Validation feedback */}
          {validation && !validation.ok && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {t("meeting_prep.validation.title")}
              </h4>
              <ul className="space-y-1.5 text-sm text-amber-900/90 dark:text-amber-100/90">
                {validation.missing.map((g) => (
                  <li key={g.field} className="flex gap-2">
                    <span className="mt-0.5">•</span>
                    {t(
                      `meeting_prep.validation.${g.messageKey}` as MessageKey,
                    )}
                  </li>
                ))}
                {validation.suggestions.map((g) => (
                  <li
                    key={g.field}
                    className="flex gap-2 text-amber-800/80 dark:text-amber-200/70"
                  >
                    <span className="mt-0.5">○</span>
                    {t(
                      `meeting_prep.validation.${g.messageKey}` as MessageKey,
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/tools/meeting-prep")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("meeting_prep.actions.back_to_list")}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>
                {t("meeting_prep.actions.save_draft")}
              </Button>
              {validation && !validation.ok ? (
                <Button onClick={handleContinueAnyway} disabled={summarizing}>
                  {summarizing && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {t("meeting_prep.actions.continue_anyway")}
                </Button>
              ) : (
                <Button onClick={handleValidate} disabled={validating}>
                  {validating && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {t("meeting_prep.actions.validate_continue")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: summary panel */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {t("meeting_prep.summary.title")}
              </h3>
              <Badge
                variant={session.status === "briefed" ? "default" : "secondary"}
                className="text-[10px] uppercase tracking-wider"
              >
                {t(
                  `meeting_prep.status.${session.status}` as MessageKey,
                )}
              </Badge>
            </div>

            {ctx.summary ? (
              <Textarea
                rows={8}
                value={ctx.summary}
                onChange={(e) => setSummary(sessionId, e.target.value)}
                className="text-sm leading-relaxed"
              />
            ) : (
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                {t("meeting_prep.summary.placeholder")}
              </p>
            )}

            <div className="flex items-center justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={regenerateSummary}
                disabled={summarizing}
                className="text-muted-foreground"
              >
                {summarizing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    {t("meeting_prep.summary.regenerating")}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    {t("meeting_prep.summary.regenerate")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionShell({
  open,
  onToggle,
  title,
  help,
  highlight = false,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  help: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <div
        className={cn(
          "rounded-xl border bg-card",
          highlight && "border-violet-300 dark:border-violet-800",
        )}
      >
        <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 p-4 text-left bg-transparent border-0 cursor-pointer">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{help}</p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">{children}</CollapsibleContent>
      </div>
    </Collapsible>
  );
}
