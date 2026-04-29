"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NoteEditor } from "@/components/notes/note-editor";
import { ArrowLeft, Trash2, X } from "lucide-react";
import {
  STATUS_CONFIG,
  STATUS_ORDER,
  CHANNEL_CONFIG,
  CHANNEL_ORDER,
  OBJECTIVE_CONFIG,
  OBJECTIVE_ORDER,
  budgetProgress,
  formatAmount,
  type CampaignChannel,
  type CampaignDetail,
  type CampaignObjective,
  type CampaignStatus,
} from "./types";

interface CampaignDetailClientProps {
  campaign: CampaignDetail;
}

const STRING_FIELDS = [
  "name",
  "description",
  "currency",
  "audience",
  "ownerId",
] as const;
type StringField = (typeof STRING_FIELDS)[number];

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export function CampaignDetailClient({ campaign }: CampaignDetailClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<Record<StringField, string>>(
    () =>
      Object.fromEntries(
        STRING_FIELDS.map((f) => [f, (campaign[f] as string | null) ?? ""])
      ) as Record<StringField, string>
  );
  const [status, setStatus] = useState<CampaignStatus>(campaign.status);
  const [objective, setObjective] = useState<CampaignObjective | "">(
    campaign.objective ?? ""
  );
  const [channels, setChannels] = useState<CampaignChannel[]>(campaign.channels);
  const [budget, setBudget] = useState(campaign.budget ?? "");
  const [spent, setSpent] = useState(campaign.spent ?? "");
  const [startDate, setStartDate] = useState(toDateInput(campaign.startDate));
  const [endDate, setEndDate] = useState(toDateInput(campaign.endDate));
  const [tags, setTags] = useState(campaign.tags);
  const [tagInput, setTagInput] = useState("");
  const [metricsText, setMetricsText] = useState(() =>
    JSON.stringify(campaign.metrics ?? {}, null, 2)
  );
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  async function patchCampaign(payload: Record<string, unknown>) {
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setSavedAt(new Date());
    return res;
  }

  function debouncedSave(payload: Record<string, unknown>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => patchCampaign(payload), 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function setField(key: StringField, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function commitField(key: StringField) {
    const original = (campaign[key] as string | null) ?? "";
    if (form[key] !== original) {
      patchCampaign({ [key]: form[key] || null });
    }
  }

  function changeStatus(v: CampaignStatus) {
    setStatus(v);
    patchCampaign({ status: v });
  }

  function changeObjective(v: CampaignObjective | "") {
    setObjective(v);
    patchCampaign({ objective: v || null });
  }

  function toggleChannel(ch: CampaignChannel) {
    const next = channels.includes(ch)
      ? channels.filter((c) => c !== ch)
      : [...channels, ch];
    setChannels(next);
    patchCampaign({ channels: next });
  }

  function commitBudget() {
    const original = campaign.budget ?? "";
    if (budget !== original) {
      patchCampaign({ budget: budget === "" ? null : Number(budget) });
    }
  }

  function commitSpent() {
    const original = campaign.spent ?? "";
    if (spent !== original) {
      patchCampaign({ spent: spent === "" ? null : Number(spent) });
    }
  }

  function commitStartDate() {
    const original = toDateInput(campaign.startDate);
    if (startDate !== original) {
      patchCampaign({ startDate: startDate === "" ? null : startDate });
    }
  }

  function commitEndDate() {
    const original = toDateInput(campaign.endDate);
    if (endDate !== original) {
      patchCampaign({ endDate: endDate === "" ? null : endDate });
    }
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
    patchCampaign({ tags: next });
  }

  function removeTag(t: string) {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    patchCampaign({ tags: next });
  }

  function commitMetrics() {
    try {
      const parsed = JSON.parse(metricsText || "{}");
      setMetricsError(null);
      patchCampaign({ metrics: parsed });
    } catch (err) {
      setMetricsError(err instanceof Error ? err.message : "JSON inválido");
    }
  }

  function handleEditorChange(json: unknown, text: string) {
    debouncedSave({ contentJson: json, contentText: text });
  }

  async function handleDelete() {
    if (
      !confirm(
        `Excluir "${form.name}"? Oportunidades atribuídas terão a atribuição removida (não serão deletadas).`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/blocks/campaigns");
      router.refresh();
    }
  }

  const statusMeta = STATUS_CONFIG[status];
  const progress = budgetProgress(spent || null, budget || null);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/blocks/campaigns"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Salvo {savedAt.toLocaleTimeString()}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Input
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          onBlur={() => commitField("name")}
          placeholder="Nome da campanha"
          className="text-xl font-semibold !border-0 !shadow-none !ring-0 px-0 focus-visible:ring-0"
        />
        <span
          className={`shrink-0 text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${statusMeta.color}`}
        >
          {statusMeta.label}
        </span>
      </div>

      <Section title="Status & objetivo">
        <Field label="Status">
          <Select
            value={status}
            onValueChange={(v) => changeStatus(v as CampaignStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Objetivo">
          <Select
            value={objective || "_none"}
            onValueChange={(v) =>
              changeObjective(v === "_none" ? "" : (v as CampaignObjective))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">—</SelectItem>
              {OBJECTIVE_ORDER.map((o) => (
                <SelectItem key={o} value={o}>
                  {OBJECTIVE_CONFIG[o]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title="Canais">
        <div className="col-span-2 flex flex-wrap gap-2">
          {CHANNEL_ORDER.map((ch) => {
            const cfg = CHANNEL_CONFIG[ch];
            const active = channels.includes(ch);
            return (
              <button
                key={ch}
                type="button"
                onClick={() => toggleChannel(ch)}
                className={`text-xs inline-flex items-center gap-1 rounded-md border px-2 py-1 transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Cronograma">
        <Field label="Início">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onBlur={commitStartDate}
          />
        </Field>
        <Field label="Fim">
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onBlur={commitEndDate}
          />
        </Field>
      </Section>

      <Section title="Orçamento">
        <Field label="Moeda">
          <Input
            value={form.currency}
            onChange={(e) => setField("currency", e.target.value)}
            onBlur={() => commitField("currency")}
            placeholder="BRL"
          />
        </Field>
        <Field label="Orçamento total">
          <Input
            type="number"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            onBlur={commitBudget}
            placeholder="0.00"
          />
        </Field>
        <Field label="Gasto até agora">
          <Input
            type="number"
            inputMode="decimal"
            value={spent}
            onChange={(e) => setSpent(e.target.value)}
            onBlur={commitSpent}
            placeholder="0.00"
          />
        </Field>
        {progress && (
          <div className="col-span-2 space-y-1">
            <div className="h-2 w-full rounded bg-muted overflow-hidden">
              <div
                className={`h-full ${
                  progress.over ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>
                {formatAmount(spent || "0", form.currency || "BRL")} de{" "}
                {formatAmount(budget, form.currency || "BRL")}
              </span>
              <span className={progress.over ? "text-rose-500" : ""}>
                {progress.pct.toFixed(0)}%
                {progress.over ? " · acima do orçamento" : ""}
              </span>
            </div>
          </div>
        )}
      </Section>

      <Section title="Audiência & Owner">
        <Field label="Audiência" full>
          <Input
            value={form.audience}
            onChange={(e) => setField("audience", e.target.value)}
            onBlur={() => commitField("audience")}
            placeholder="ex: clientes ativos no SP, leads frios SaaS"
          />
        </Field>
        <Field label="Owner (UUID)" full>
          <Input
            value={form.ownerId}
            onChange={(e) => setField("ownerId", e.target.value)}
            onBlur={() => commitField("ownerId")}
            placeholder="—"
          />
        </Field>
      </Section>

      <Section title="Descrição">
        <div className="col-span-2">
          <Textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            onBlur={() => commitField("description")}
            rows={3}
            placeholder="Resumo da campanha…"
          />
        </div>
      </Section>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Tags
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">
              {t}
              <button
                onClick={() => removeTag(t)}
                aria-label={`Remove tag ${t}`}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Adicionar tag…"
            className="h-7 w-40 text-xs"
          />
        </div>
      </div>

      <Section title="Métricas (JSON)">
        <div className="col-span-2 space-y-1">
          <Textarea
            value={metricsText}
            onChange={(e) => setMetricsText(e.target.value)}
            onBlur={commitMetrics}
            rows={6}
            className="font-mono text-xs"
            placeholder='{ "impressions": 0, "clicks": 0, "conversions": 0 }'
          />
          {metricsError && (
            <p className="text-xs text-rose-500">{metricsError}</p>
          )}
        </div>
      </Section>

      <Section title="Notas">
        <div className="col-span-2">
          <NoteEditor
            initialJson={campaign.contentJson}
            onChange={handleEditorChange}
          />
        </div>
      </Section>

      {campaign.deals && campaign.deals.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Oportunidades atribuídas ({campaign.deals.length})
          </Label>
          <div className="rounded-md border divide-y">
            {campaign.deals.map((d) => (
              <Link
                key={d.id}
                href={`/admin/blocks/deals/${d.id}`}
                className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.stage}
                    {d.amount
                      ? ` · ${formatAmount(d.amount, d.currency)}`
                      : ""}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
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
    <div className="space-y-2">
      <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1 ${full ? "col-span-2" : ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
