"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Edit3,
  Loader2,
  Printer,
  RefreshCw,
  Sparkles,
  X,
  AlertTriangle,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { useMeetingPrepStore } from "@/stores/meeting-prep-store";
import {
  PREP_PLAN_SECTION_KEYS,
  type AnchorPhrases,
  type AnticipatedQuestion,
  type ObjectionItem,
  type ObjectiveItem,
  type PrepPlanSection,
  type PrepPlanSections,
  type RiskItem,
} from "@/lib/meeting-prep/types";
import {
  computeInputsSignature,
  regeneratePrepPlanSection,
  streamPrepPlan,
} from "@/lib/meeting-prep/mock-llm";
import { planToMarkdown } from "@/lib/meeting-prep/plan-export";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/lib/i18n/format-relative-time";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import { cn } from "@/lib/utils";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

interface PrepPlanClientProps {
  sessionId: string;
}

const SECTION_LABEL_KEYS: Record<PrepPlanSection, MessageKey> = {
  executiveSummary: "meeting_prep.plan.section.executive_summary",
  objectives: "meeting_prep.plan.section.objectives",
  counterpartMotives: "meeting_prep.plan.section.counterpart_motives",
  risks: "meeting_prep.plan.section.risks",
  opportunities: "meeting_prep.plan.section.opportunities",
  anticipatedQuestions: "meeting_prep.plan.section.anticipated_questions",
  myQuestions: "meeting_prep.plan.section.my_questions",
  objections: "meeting_prep.plan.section.objections",
  anchorPhrases: "meeting_prep.plan.section.anchor_phrases",
  planB: "meeting_prep.plan.section.plan_b",
  materialsChecklist: "meeting_prep.plan.section.materials_checklist",
};

export function PrepPlanClient({ sessionId }: PrepPlanClientProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const session = useMeetingPrepStore((s) => s.sessions[sessionId]);
  // Stable selector: pull the whole map and useMemo, otherwise the
  // `?? []` fallback returns a new array every render and loops.
  const activationsMap = useMeetingPrepStore((s) => s.activations);
  const activations = useMemo(
    () => activationsMap[sessionId] ?? [],
    [activationsMap, sessionId],
  );
  const plan = useMeetingPrepStore((s) => s.prepPlans[sessionId] ?? null);
  const startPlan = useMeetingPrepStore((s) => s.startPlan);
  const setPlanSection = useMeetingPrepStore((s) => s.setPlanSection);
  const setPlanSectionStatus = useMeetingPrepStore(
    (s) => s.setPlanSectionStatus,
  );
  const markPlanEdited = useMeetingPrepStore((s) => s.markPlanEdited);
  const refreshPlanSignature = useMeetingPrepStore(
    (s) => s.refreshPlanSignature,
  );
  const setStatus = useMeetingPrepStore((s) => s.setStatus);

  const [generating, setGenerating] = useState(false);
  const [staleDismissed, setStaleDismissed] = useState(false);

  // Live signature — used to detect staleness against the snapshot
  // recorded when the plan was last generated.
  const liveSignature = useMemo(() => {
    if (!session) return "";
    return computeInputsSignature(session.context, activations);
  }, [session, activations]);

  const isStale =
    !!plan &&
    plan.inputsSignature !== liveSignature &&
    !staleDismissed &&
    !generating;

  if (!hydrated) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-1/3 rounded bg-muted animate-pulse" />
        <div className="h-64 rounded bg-muted animate-pulse" />
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

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setStaleDismissed(false);
    const sig = computeInputsSignature(session.context, activations);
    startPlan(sessionId, sig);
    try {
      await streamPrepPlan(
        session.context,
        activations,
        // The streamer fires once per section with the final value;
        // the store stamps it in immediately so the UI renders live.
        (key, value) => {
          setPlanSection(sessionId, key, value as never);
        },
      );
      setStatus(sessionId, "plan_ready");
      notifySuccess("meeting_prep.feedback.plan_ready", t);
    } catch {
      // Surface to the user but don't crash — they can hit Generate again.
      notifyError("error.meeting_prep.validate_failed", t);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateSection = async (key: PrepPlanSection) => {
    if (!plan) return;
    setPlanSectionStatus(sessionId, key, true);
    try {
      const fresh = await regeneratePrepPlanSection(
        session.context,
        activations,
        key,
      );
      setPlanSection(sessionId, key, fresh as never);
      // Single-section regen updates the snapshot so the stale banner
      // doesn't keep nagging when only this section was the diff.
      refreshPlanSignature(
        sessionId,
        computeInputsSignature(session.context, activations),
      );
      notifySuccess("meeting_prep.feedback.plan_section_regenerated", t);
    } finally {
      setPlanSectionStatus(sessionId, key, false);
    }
  };

  const handleSectionEdit = (key: PrepPlanSection, value: unknown) => {
    setPlanSection(sessionId, key, value as never);
    markPlanEdited(sessionId);
  };

  const handleCopyMarkdown = async () => {
    if (!plan) return;
    const md = planToMarkdown(plan, session.context);
    try {
      await navigator.clipboard.writeText(md);
      notifySuccess("meeting_prep.feedback.plan_md_copied", t);
    } catch {
      notifyError("error.meeting_prep.validate_failed", t);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 px-4 max-w-7xl">
      <PageHeader
        crumbs={[
          { label: t("meeting_prep.briefing.crumb"), href: "/admin/tools" },
          {
            label: t("meeting_prep.tool.name"),
            href: "/admin/tools/meeting-prep",
          },
          {
            label: session.title.trim() || t("meeting_prep.list.untitled"),
            href: `/admin/tools/meeting-prep/${sessionId}`,
          },
        ]}
        title={t("meeting_prep.plan.title")}
        description={t("meeting_prep.plan.description")}
        action={
          plan ? (
            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMarkdown}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                {t("meeting_prep.plan.action.copy_md")}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                {t("meeting_prep.plan.action.print")}
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  // Future: navigate to /role-play when feature 04 ships.
                  notifySuccess("meeting_prep.feedback.plan_ready", t)
                }
                className="bg-violet-600 hover:bg-violet-700"
              >
                {t("meeting_prep.plan.action.continue")}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          ) : null
        }
      />

      {!plan ? (
        <EmptyState
          generating={generating}
          onGenerate={handleGenerate}
          activationCount={activations.length}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
          {/* Sticky TOC */}
          <aside className="lg:sticky lg:top-4 self-start space-y-1 print:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">
              {t("meeting_prep.plan.toc.title")}
            </p>
            {PREP_PLAN_SECTION_KEYS.map((k, i) => (
              <a
                key={k}
                href={`#section-${k}`}
                className="block text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded px-2 py-1.5 leading-tight"
              >
                <span className="text-muted-foreground/60 tabular-nums mr-1.5">
                  {i + 1}.
                </span>
                {t(SECTION_LABEL_KEYS[k])}
              </a>
            ))}
            <div className="border-t my-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
              className="w-full justify-start text-xs text-muted-foreground"
            >
              <RefreshCw
                className={cn(
                  "h-3 w-3 mr-1.5",
                  generating && "animate-spin",
                )}
              />
              {t("meeting_prep.plan.action.regenerate_all")}
            </Button>
          </aside>

          {/* Reading column */}
          <article className="max-w-[720px] mx-auto w-full">
            {isStale && (
              <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-3 mb-6 flex items-start gap-3 print:hidden">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    {t("meeting_prep.plan.stale.title")}
                  </p>
                  <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
                    {t("meeting_prep.plan.stale.body")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-amber-600 hover:bg-amber-700 h-7"
                  >
                    {generating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStaleDismissed(true)}
                    className="h-7"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground tabular-nums mb-6 print:hidden">
              {t("meeting_prep.plan.generated_at", {
                when: formatRelativeTime(new Date(plan.generatedAt), locale),
              })}
              {plan.editedAt &&
                ` · ${t("meeting_prep.plan.edited_at", {
                  when: formatRelativeTime(new Date(plan.editedAt), locale),
                })}`}
            </div>

            {PREP_PLAN_SECTION_KEYS.map((key) => (
              <SectionWrapper
                key={key}
                sectionKey={key}
                title={t(SECTION_LABEL_KEYS[key])}
                streaming={plan.sectionStatus[key] === "streaming"}
                onRegenerate={() => handleRegenerateSection(key)}
              >
                <SectionRenderer
                  sectionKey={key}
                  sections={plan.sections}
                  onEdit={(value) => handleSectionEdit(key, value)}
                />
              </SectionWrapper>
            ))}
          </article>
        </div>
      )}
    </div>
  );
}

// ─── Empty / first-generation state ─────────────────────────────────

function EmptyState({
  generating,
  onGenerate,
  activationCount,
}: {
  generating: boolean;
  onGenerate: () => void;
  activationCount: number;
}) {
  const t = useT();
  return (
    <div className="rounded-xl border border-dashed p-12 text-center max-w-2xl mx-auto">
      <div className="mx-auto rounded-full bg-violet-100 dark:bg-violet-950/50 p-3 w-fit mb-4">
        <Sparkles className="h-6 w-6 text-violet-600" />
      </div>
      <h3 className="font-semibold text-lg">
        {t("meeting_prep.plan.empty.title")}
      </h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        {t("meeting_prep.plan.empty.body")}
      </p>
      {activationCount > 0 && (
        <Badge variant="secondary" className="mt-3 text-xs">
          {activationCount} specialists active
        </Badge>
      )}
      <Button
        onClick={onGenerate}
        disabled={generating}
        className="mt-6 bg-violet-600 hover:bg-violet-700"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("meeting_prep.plan.action.regenerating")}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            {t("meeting_prep.plan.action.generate")}
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Section wrapper (header + actions + edit toggle) ───────────────

function SectionWrapper({
  sectionKey,
  title,
  streaming,
  onRegenerate,
  children,
}: {
  sectionKey: PrepPlanSection;
  title: string;
  streaming: boolean;
  onRegenerate: () => void;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <section
      id={`section-${sectionKey}`}
      className="mb-10 scroll-mt-6 group"
    >
      <header className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity print:hidden">
          {streaming ? (
            <Badge variant="secondary" className="text-[10px]">
              <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
              {t("meeting_prep.plan.action.regenerating")}
            </Badge>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="h-7 text-xs text-muted-foreground"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {t("meeting_prep.plan.action.regenerate_section")}
            </Button>
          )}
        </div>
      </header>
      <div className={cn(streaming && "opacity-60 pointer-events-none")}>
        {children}
      </div>
    </section>
  );
}

// ─── Section renderers — each section type owns its own editor ─────

function SectionRenderer({
  sectionKey,
  sections,
  onEdit,
}: {
  sectionKey: PrepPlanSection;
  sections: PrepPlanSections;
  onEdit: (value: unknown) => void;
}) {
  switch (sectionKey) {
    case "executiveSummary":
      return (
        <EditableText
          value={sections.executiveSummary}
          onSave={(v) => onEdit(v)}
          rows={4}
        />
      );
    case "planB":
      return (
        <EditableText
          value={sections.planB}
          onSave={(v) => onEdit(v)}
          rows={5}
        />
      );
    case "objectives":
      return (
        <EditableObjectives
          value={sections.objectives}
          onSave={(v) => onEdit(v)}
        />
      );
    case "counterpartMotives":
      return (
        <EditableBulletList
          value={sections.counterpartMotives}
          onSave={(v) => onEdit(v)}
        />
      );
    case "opportunities":
      return (
        <EditableBulletList
          value={sections.opportunities}
          onSave={(v) => onEdit(v)}
        />
      );
    case "myQuestions":
      return (
        <EditableBulletList
          value={sections.myQuestions}
          onSave={(v) => onEdit(v)}
        />
      );
    case "materialsChecklist":
      return (
        <EditableBulletList
          value={sections.materialsChecklist}
          onSave={(v) => onEdit(v)}
          checklist
        />
      );
    case "risks":
      return (
        <EditableRisks value={sections.risks} onSave={(v) => onEdit(v)} />
      );
    case "anticipatedQuestions":
      return (
        <EditableQA
          value={sections.anticipatedQuestions}
          onSave={(v) => onEdit(v)}
        />
      );
    case "objections":
      return (
        <EditableObjections
          value={sections.objections}
          onSave={(v) => onEdit(v)}
        />
      );
    case "anchorPhrases":
      return (
        <EditableAnchors
          value={sections.anchorPhrases}
          onSave={(v) => onEdit(v)}
        />
      );
    default:
      return null;
  }
}

// ─── Editable atoms ─────────────────────────────────────────────────

function useToggleEdit(initial = false) {
  const [editing, setEditing] = useState(initial);
  return { editing, setEditing };
}

function EditableText({
  value,
  onSave,
  rows = 3,
}: {
  value: string;
  onSave: (v: string) => void;
  rows?: number;
}) {
  const t = useT();
  const { editing, setEditing } = useToggleEdit();
  const [draft, setDraft] = useState(value);
  // Sync draft when value changes from outside (regen/stream).
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  if (!editing) {
    return (
      <div className="group/edit relative">
        <p className="leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {value || (
            <span className="italic text-muted-foreground">
              {t("meeting_prep.plan.placeholder.text")}
            </span>
          )}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover/edit:opacity-100 absolute -top-1 right-0 h-7 text-xs print:hidden"
        >
          <Edit3 className="h-3 w-3 mr-1" />
          {t("meeting_prep.plan.action.edit")}
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Textarea
        rows={rows}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onSave(draft);
          setEditing(false);
        }}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDraft(value);
            setEditing(false);
          }}
        >
          {t("meeting_prep.plan.action.cancel")}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onSave(draft);
            setEditing(false);
          }}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Check className="h-3 w-3 mr-1" />
          {t("meeting_prep.plan.action.save")}
        </Button>
      </div>
    </div>
  );
}

function EditableBulletList({
  value,
  onSave,
  checklist = false,
}: {
  value: string[];
  onSave: (v: string[]) => void;
  checklist?: boolean;
}) {
  const t = useT();
  const { editing, setEditing } = useToggleEdit();
  const [draft, setDraft] = useState(value.join("\n"));
  useEffect(() => {
    if (!editing) setDraft(value.join("\n"));
  }, [value, editing]);
  const commit = () => {
    const parsed = draft
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    onSave(parsed);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="group/edit relative">
        <ul className="space-y-1.5 text-foreground/90">
          {value.map((item, i) => (
            <li key={i} className="flex gap-2 leading-relaxed">
              {checklist ? (
                <span className="text-muted-foreground/60 mt-0.5">☐</span>
              ) : (
                <span className="text-violet-600 mt-0.5">•</span>
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover/edit:opacity-100 absolute -top-1 right-0 h-7 text-xs print:hidden"
        >
          <Edit3 className="h-3 w-3 mr-1" />
          {t("meeting_prep.plan.action.edit")}
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Textarea
        rows={Math.max(4, value.length + 1)}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        placeholder="Um item por linha"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDraft(value.join("\n"));
            setEditing(false);
          }}
        >
          {t("meeting_prep.plan.action.cancel")}
        </Button>
        <Button
          size="sm"
          onClick={commit}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Check className="h-3 w-3 mr-1" />
          {t("meeting_prep.plan.action.save")}
        </Button>
      </div>
    </div>
  );
}

function EditableObjectives({
  value,
  onSave,
}: {
  value: ObjectiveItem[];
  onSave: (v: ObjectiveItem[]) => void;
}) {
  const t = useT();
  return (
    <ol className="space-y-3 text-foreground/90">
      {value.map((o, i) => (
        <li
          key={i}
          className="rounded-lg border bg-card/50 p-3 flex gap-3 items-start"
        >
          <span className="font-semibold text-violet-600 tabular-nums shrink-0">
            {i + 1}.
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <EditableInline
              value={o.text}
              onSave={(v) => {
                const next = value.map((x, idx) =>
                  idx === i ? { ...x, text: v } : x,
                );
                onSave(next);
              }}
              className="font-medium leading-snug"
            />
            <div className="text-xs text-muted-foreground">
              <span className="uppercase tracking-wider text-[10px] font-semibold mr-1">
                {t("meeting_prep.plan.label.rationale")}:
              </span>
              <EditableInline
                inline
                value={o.rationale}
                onSave={(v) => {
                  const next = value.map((x, idx) =>
                    idx === i ? { ...x, rationale: v } : x,
                  );
                  onSave(next);
                }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function EditableRisks({
  value,
  onSave,
}: {
  value: RiskItem[];
  onSave: (v: RiskItem[]) => void;
}) {
  const t = useT();
  return (
    <ul className="space-y-3 text-foreground/90">
      {value.map((r, i) => (
        <li
          key={i}
          className="rounded-lg border-l-4 border-red-300 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20 px-3 py-2"
        >
          <EditableInline
            value={r.text}
            onSave={(v) => {
              const next = value.map((x, idx) =>
                idx === i ? { ...x, text: v } : x,
              );
              onSave(next);
            }}
            className="font-medium leading-snug"
          />
          <div className="text-xs text-muted-foreground mt-1">
            <span className="uppercase tracking-wider text-[10px] font-semibold mr-1">
              {t("meeting_prep.plan.label.mitigation")}:
            </span>
            <EditableInline
              inline
              value={r.mitigation}
              onSave={(v) => {
                const next = value.map((x, idx) =>
                  idx === i ? { ...x, mitigation: v } : x,
                );
                onSave(next);
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EditableQA({
  value,
  onSave,
}: {
  value: AnticipatedQuestion[];
  onSave: (v: AnticipatedQuestion[]) => void;
}) {
  const t = useT();
  return (
    <ul className="space-y-3 text-foreground/90">
      {value.map((q, i) => (
        <li
          key={i}
          className="rounded-lg border bg-card/50 p-3 space-y-1.5"
        >
          <EditableInline
            value={q.question}
            onSave={(v) => {
              const next = value.map((x, idx) =>
                idx === i ? { ...x, question: v } : x,
              );
              onSave(next);
            }}
            className="font-medium leading-snug"
          />
          <div className="text-xs text-muted-foreground">
            <span className="uppercase tracking-wider text-[10px] font-semibold mr-1">
              {t("meeting_prep.plan.label.suggested_answer")}:
            </span>
            <EditableInline
              inline
              value={q.suggestedAnswer}
              onSave={(v) => {
                const next = value.map((x, idx) =>
                  idx === i ? { ...x, suggestedAnswer: v } : x,
                );
                onSave(next);
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EditableObjections({
  value,
  onSave,
}: {
  value: ObjectionItem[];
  onSave: (v: ObjectionItem[]) => void;
}) {
  const t = useT();
  return (
    <ul className="space-y-3 text-foreground/90">
      {value.map((o, i) => (
        <li
          key={i}
          className="rounded-lg border bg-card/50 p-3 space-y-1.5"
        >
          <EditableInline
            value={o.objection}
            onSave={(v) => {
              const next = value.map((x, idx) =>
                idx === i ? { ...x, objection: v } : x,
              );
              onSave(next);
            }}
            className="font-medium leading-snug"
          />
          <div className="text-xs text-muted-foreground">
            <span className="uppercase tracking-wider text-[10px] font-semibold mr-1">
              {t("meeting_prep.plan.label.reveals")}:
            </span>
            <EditableInline
              inline
              value={o.reveals}
              onSave={(v) => {
                const next = value.map((x, idx) =>
                  idx === i ? { ...x, reveals: v } : x,
                );
                onSave(next);
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="uppercase tracking-wider text-[10px] font-semibold mr-1">
              {t("meeting_prep.plan.label.response")}:
            </span>
            <EditableInline
              inline
              value={o.response}
              onSave={(v) => {
                const next = value.map((x, idx) =>
                  idx === i ? { ...x, response: v } : x,
                );
                onSave(next);
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EditableAnchors({
  value,
  onSave,
}: {
  value: AnchorPhrases;
  onSave: (v: AnchorPhrases) => void;
}) {
  const t = useT();
  const slots: Array<{ key: keyof AnchorPhrases; labelKey: MessageKey; color: string }> = [
    { key: "opening", labelKey: "meeting_prep.plan.label.opening", color: "#0ea5e9" },
    { key: "pivot", labelKey: "meeting_prep.plan.label.pivot", color: "#f59e0b" },
    { key: "closing", labelKey: "meeting_prep.plan.label.closing", color: "#8b5cf6" },
  ];
  return (
    <ul className="space-y-3">
      {slots.map((slot) => (
        <li
          key={slot.key}
          className="rounded-lg p-3 border-l-4"
          style={{
            borderLeftColor: slot.color,
            backgroundColor: `${slot.color}10`,
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: slot.color }}
          >
            {t(slot.labelKey)}
          </p>
          <EditableInline
            value={value[slot.key]}
            onSave={(v) => onSave({ ...value, [slot.key]: v })}
            className="italic leading-relaxed"
          />
        </li>
      ))}
    </ul>
  );
}

/** Small inline editor — click to edit, blur to save. */
function EditableInline({
  value,
  onSave,
  className,
  inline = false,
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  inline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={() => setEditing(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setEditing(true);
        }}
        className={cn(
          "rounded-sm hover:bg-muted/50 -mx-1 px-1 cursor-text",
          inline ? "inline" : "block",
          className,
        )}
      >
        {value || (
          <span className="italic text-muted-foreground">…</span>
        )}
      </span>
    );
  }
  return (
    <Textarea
      ref={ref}
      rows={inline ? 2 : 3}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onSave(draft);
        setEditing(false);
      }}
      className="text-sm"
    />
  );
}
