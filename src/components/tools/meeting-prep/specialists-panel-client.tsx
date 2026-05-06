"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Plus,
  Sparkles,
} from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { useMeetingPrepStore } from "@/stores/meeting-prep-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getTemplate,
  getTemplatesByKind,
} from "@/lib/meeting-prep/specialist-templates";
import {
  generateCustomOutput,
  generateSpecialistOutput,
  streamSpecialistActivation,
} from "@/lib/meeting-prep/mock-llm";
import {
  MAX_ACTIVATIONS_PER_SESSION,
  type SpecialistActivation,
  type SpecialistOutput,
} from "@/lib/meeting-prep/types";
import { notifySuccess } from "@/lib/i18n/notify";
import { SpecialistTemplateCard } from "./specialist-template-card";
import { SpecialistOutputCard } from "./specialist-output-card";
import { cn } from "@/lib/utils";

interface SpecialistsPanelClientProps {
  sessionId: string;
}

type Tab = "archetype" | "inspired" | "custom";

/**
 * Two-mode UI:
 *   - SELECT mode (default until at least one activation has been started):
 *     gallery with 3 tabs, multi-select up to MAX, a "Convene panel" CTA.
 *   - PANEL mode: rendered cards stream in parallel; user can pin/regen/remove
 *     and add more (custom or back to gallery via "Add to panel" toggling).
 *
 * State is local — the store holds activations + the workspace toggle.
 */
export function SpecialistsPanelClient({ sessionId }: SpecialistsPanelClientProps) {
  const t = useT();
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const session = useMeetingPrepStore((s) => s.sessions[sessionId]);
  const activationsMap = useMeetingPrepStore((s) => s.activations);
  const enableInspired = useMeetingPrepStore((s) => s.enableInspiredPersonas);
  const setEnableInspired = useMeetingPrepStore(
    (s) => s.setEnableInspiredPersonas,
  );

  const addActivation = useMeetingPrepStore((s) => s.addActivation);
  const updateActivationOutput = useMeetingPrepStore(
    (s) => s.updateActivationOutput,
  );
  const setActivationStatus = useMeetingPrepStore(
    (s) => s.setActivationStatus,
  );
  const togglePinned = useMeetingPrepStore((s) => s.togglePinned);
  const removeActivation = useMeetingPrepStore((s) => s.removeActivation);
  const resetActivationOutput = useMeetingPrepStore(
    (s) => s.resetActivationOutput,
  );
  const setStatus = useMeetingPrepStore((s) => s.setStatus);

  // Stable list selector; sort by createdAt asc so panel ordering is stable.
  const activations: SpecialistActivation[] = useMemo(() => {
    const list = activationsMap[sessionId] ?? [];
    return [...list].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [activationsMap, sessionId]);

  const [activeTab, setActiveTab] = useState<Tab>("archetype");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customDescription, setCustomDescription] = useState("");

  const inSelectMode = activations.length === 0;

  // ── Kick off a streaming run for an activation ─────────────────────
  // Pulled out so both initial convene and regeneration share the path.
  const runActivation = async (
    activationId: string,
    finalOutput: SpecialistOutput,
  ) => {
    setActivationStatus(sessionId, activationId, "streaming");
    await streamSpecialistActivation(finalOutput, (phase, partial) => {
      updateActivationOutput(
        sessionId,
        activationId,
        partial,
        phase === "complete" ? "complete" : "streaming",
      );
    });
  };

  const handleConvenePanel = async () => {
    if (!session) return;
    if (selected.size === 0) return;

    // Spec §5: cards populate in parallel via streaming.
    const ids: { id: string; output: SpecialistOutput }[] = [];
    for (const templateId of selected) {
      const tpl = getTemplate(templateId);
      if (!tpl) continue;
      const aid = addActivation(sessionId, {
        templateId: tpl.id,
        customDescription: null,
        displayName: tpl.name,
        kind: tpl.kind,
      });
      const finalOut = generateSpecialistOutput(tpl, session.context);
      ids.push({ id: aid, output: finalOut });
    }

    setSelected(new Set());
    // Fire all activations in parallel.
    await Promise.all(ids.map(({ id, output }) => runActivation(id, output)));
    setStatus(sessionId, "specialists_ready");
    notifySuccess("meeting_prep.feedback.specialists_ready", t);
  };

  const handleAddCustom = async () => {
    if (!session) return;
    const desc = customDescription.trim();
    if (!desc) return;
    if (activations.length >= MAX_ACTIVATIONS_PER_SESSION) return;
    const aid = addActivation(sessionId, {
      templateId: null,
      customDescription: desc,
      displayName: desc.slice(0, 40),
      kind: "custom",
    });
    setCustomDescription("");
    const out = generateCustomOutput(desc, session.context);
    await runActivation(aid, out);
    setStatus(sessionId, "specialists_ready");
  };

  const handleAddFromGallery = async (templateId: string) => {
    if (!session) return;
    if (activations.length >= MAX_ACTIVATIONS_PER_SESSION) return;
    const tpl = getTemplate(templateId);
    if (!tpl) return;
    const aid = addActivation(sessionId, {
      templateId: tpl.id,
      customDescription: null,
      displayName: tpl.name,
      kind: tpl.kind,
    });
    const out = generateSpecialistOutput(tpl, session.context);
    await runActivation(aid, out);
  };

  const handleRegenerate = async (activation: SpecialistActivation) => {
    if (!session) return;
    resetActivationOutput(sessionId, activation.id);

    let out: SpecialistOutput;
    if (activation.templateId) {
      const tpl = getTemplate(activation.templateId);
      if (!tpl) return;
      out = generateSpecialistOutput(tpl, session.context);
    } else if (activation.customDescription) {
      out = generateCustomOutput(activation.customDescription, session.context);
    } else {
      return;
    }
    await runActivation(activation.id, out);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_ACTIVATIONS_PER_SESSION) next.add(id);
      return next;
    });
  };

  if (!hydrated) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-1/3 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-40 rounded bg-muted animate-pulse" />
          <div className="h-40 rounded bg-muted animate-pulse" />
          <div className="h-40 rounded bg-muted animate-pulse" />
        </div>
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

  const archetypes = getTemplatesByKind("archetype");
  const inspired = getTemplatesByKind("inspired");
  const activeTemplateIds = new Set(
    activations.map((a) => a.templateId).filter((x): x is string => !!x),
  );
  const remaining =
    MAX_ACTIVATIONS_PER_SESSION - activations.length - selected.size;

  return (
    <div className="space-y-6 max-w-7xl px-4">
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
        title={t("meeting_prep.specialists.title")}
        description={t("meeting_prep.specialists.description")}
        action={
          <Badge variant="outline" className="text-xs">
            {t("meeting_prep.specialists.selected_count", {
              count: inSelectMode ? selected.size : activations.length,
              max: MAX_ACTIVATIONS_PER_SESSION,
            })}
          </Badge>
        }
      />

      {inSelectMode ? (
        <SelectMode
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selected={selected}
          onToggle={toggleSelect}
          archetypes={archetypes}
          inspired={inspired}
          enableInspired={enableInspired}
          onToggleInspired={setEnableInspired}
          customDescription={customDescription}
          onCustomDescriptionChange={setCustomDescription}
          onAddCustom={handleAddCustom}
          onConvene={handleConvenePanel}
          remaining={remaining}
        />
      ) : (
        <PanelMode
          activations={activations}
          onPin={(a) => togglePinned(sessionId, a.id)}
          onRegenerate={handleRegenerate}
          onRemove={(a) => removeActivation(sessionId, a.id)}
          onAddFromGallery={handleAddFromGallery}
          archetypes={archetypes.filter(
            (x) => !activeTemplateIds.has(x.id),
          )}
          inspired={inspired.filter((x) => !activeTemplateIds.has(x.id))}
          enableInspired={enableInspired}
          customDescription={customDescription}
          onCustomDescriptionChange={setCustomDescription}
          onAddCustom={handleAddCustom}
          remaining={
            MAX_ACTIVATIONS_PER_SESSION - activations.length
          }
          onContinue={() =>
            router.push(`/admin/tools/meeting-prep/${sessionId}/plan`)
          }
          onBack={() =>
            router.push(`/admin/tools/meeting-prep/${sessionId}`)
          }
        />
      )}
    </div>
  );
}

// ─── Select mode — gallery with tabs ─────────────────────────────────

function SelectMode({
  activeTab,
  onTabChange,
  selected,
  onToggle,
  archetypes,
  inspired,
  enableInspired,
  onToggleInspired,
  customDescription,
  onCustomDescriptionChange,
  onAddCustom,
  onConvene,
  remaining,
}: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
  archetypes: ReturnType<typeof getTemplatesByKind>;
  inspired: ReturnType<typeof getTemplatesByKind>;
  enableInspired: boolean;
  onToggleInspired: (v: boolean) => void;
  customDescription: string;
  onCustomDescriptionChange: (v: string) => void;
  onAddCustom: () => void;
  onConvene: () => void;
  remaining: number;
}) {
  const t = useT();
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as Tab)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="archetype">
            {t("meeting_prep.specialists.tab.archetype")}
          </TabsTrigger>
          <TabsTrigger value="inspired">
            {t("meeting_prep.specialists.tab.inspired")}
          </TabsTrigger>
          <TabsTrigger value="custom">
            {t("meeting_prep.specialists.tab.custom")}
          </TabsTrigger>
        </TabsList>

        <Button
          onClick={onConvene}
          disabled={selected.size === 0}
          className={cn(
            "bg-violet-600 hover:bg-violet-700",
            selected.size === 0 && "opacity-60",
          )}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {t("meeting_prep.specialists.convene")}
        </Button>
      </div>

      <TabsContent value="archetype" className="mt-4">
        <Gallery
          templates={archetypes}
          selected={selected}
          onToggle={onToggle}
          remaining={remaining}
        />
      </TabsContent>

      <TabsContent value="inspired" className="mt-4 space-y-4">
        <InspiredToggleBar
          enabled={enableInspired}
          onChange={onToggleInspired}
        />
        {!enableInspired ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Lock className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t("meeting_prep.specialists.inspired.disabled_body")}
            </p>
          </div>
        ) : (
          <Gallery
            templates={inspired}
            selected={selected}
            onToggle={onToggle}
            remaining={remaining}
          />
        )}
      </TabsContent>

      <TabsContent value="custom" className="mt-4">
        <CustomComposer
          value={customDescription}
          onChange={onCustomDescriptionChange}
          onAdd={onAddCustom}
        />
      </TabsContent>
    </Tabs>
  );
}

// ─── Panel mode — output cards + actions ─────────────────────────────

function PanelMode({
  activations,
  onPin,
  onRegenerate,
  onRemove,
  onAddFromGallery,
  archetypes,
  inspired,
  enableInspired,
  customDescription,
  onCustomDescriptionChange,
  onAddCustom,
  remaining,
  onContinue,
  onBack,
}: {
  activations: SpecialistActivation[];
  onPin: (a: SpecialistActivation) => void;
  onRegenerate: (a: SpecialistActivation) => void;
  onRemove: (a: SpecialistActivation) => void;
  onAddFromGallery: (id: string) => void;
  archetypes: ReturnType<typeof getTemplatesByKind>;
  inspired: ReturnType<typeof getTemplatesByKind>;
  enableInspired: boolean;
  customDescription: string;
  onCustomDescriptionChange: (v: string) => void;
  onAddCustom: () => void;
  remaining: number;
  onContinue: () => void;
  onBack: () => void;
}) {
  const t = useT();
  const [showAdd, setShowAdd] = useState(false);
  const allComplete = activations.every((a) => a.status === "complete");
  const pinnedCount = activations.filter((a) => a.pinned).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {activations.map((a) => (
          <SpecialistOutputCard
            key={a.id}
            activation={a}
            onTogglePin={() => onPin(a)}
            onRegenerate={() => onRegenerate(a)}
            onRemove={() => onRemove(a)}
          />
        ))}
      </div>

      {remaining > 0 && (
        <div className="rounded-xl border bg-card">
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("meeting_prep.specialists.add_to_panel")} (
              {remaining} {remaining === 1 ? "slot" : "slots"})
            </span>
          </button>
          {showAdd && (
            <div className="border-t p-4 space-y-4">
              {archetypes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("meeting_prep.specialists.tab.archetype")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {archetypes.map((tpl) => (
                      <Button
                        key={tpl.id}
                        size="sm"
                        variant="outline"
                        onClick={() => onAddFromGallery(tpl.id)}
                      >
                        {tpl.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {enableInspired && inspired.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("meeting_prep.specialists.tab.inspired")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {inspired.map((tpl) => (
                      <Button
                        key={tpl.id}
                        size="sm"
                        variant="outline"
                        onClick={() => onAddFromGallery(tpl.id)}
                      >
                        {t("meeting_prep.specialists.inspired.style_prefix", {
                          name: tpl.name,
                        })}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("meeting_prep.specialists.tab.custom")}
                </p>
                <CustomComposer
                  value={customDescription}
                  onChange={onCustomDescriptionChange}
                  onAdd={onAddCustom}
                  inline
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("meeting_prep.actions.back_to_list")}
        </Button>
        <div className="flex items-center gap-2">
          {pinnedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pinnedCount} pinned
            </Badge>
          )}
          <Button
            onClick={onContinue}
            disabled={!allComplete || activations.length === 0}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {t("meeting_prep.specialists.next_step")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function Gallery({
  templates,
  selected,
  onToggle,
  remaining,
}: {
  templates: ReturnType<typeof getTemplatesByKind>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  remaining: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {templates.map((tpl) => {
        const isSel = selected.has(tpl.id);
        return (
          <SpecialistTemplateCard
            key={tpl.id}
            template={tpl}
            selected={isSel}
            disabled={!isSel && remaining <= 0}
            onToggle={() => onToggle(tpl.id)}
          />
        );
      })}
    </div>
  );
}

function InspiredToggleBar({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useT();
  return (
    <div className="rounded-lg border bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 p-3 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          {t("meeting_prep.specialists.inspired.toggle")}
        </p>
        <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
          {t("meeting_prep.specialists.inspired.toggle_help")}
        </p>
      </div>
      <Switch checked={enabled} onCheckedChange={onChange} />
    </div>
  );
}

function CustomComposer({
  value,
  onChange,
  onAdd,
  inline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  inline?: boolean;
}) {
  const t = useT();
  return (
    <div className={cn("space-y-3", !inline && "rounded-xl border bg-card p-4")}>
      {!inline && (
        <>
          <h3 className="text-sm font-semibold">
            {t("meeting_prep.specialists.custom.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("meeting_prep.specialists.custom.description")}
          </p>
        </>
      )}
      <div className="space-y-2">
        {!inline && (
          <Label htmlFor="mp-custom">
            {t("meeting_prep.specialists.custom.title")}
          </Label>
        )}
        <Textarea
          id="mp-custom"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("meeting_prep.specialists.custom.placeholder")}
          rows={3}
        />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={onAdd}
          disabled={!value.trim()}
          variant={inline ? "outline" : "default"}
          className={cn(
            !inline && "bg-violet-600 hover:bg-violet-700",
          )}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {t("meeting_prep.specialists.action.add_custom")}
        </Button>
      </div>
    </div>
  );
}
