"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NoteEditor } from "@/components/notes/note-editor";
import { CompanyPicker } from "@/components/companies/company-picker";
import { ContactPicker } from "@/components/contacts/contact-picker";
import { CampaignPicker } from "@/components/campaigns/campaign-picker";
import { ArrowLeft, Trash2, X } from "lucide-react";
import {
  STAGE_CONFIG,
  STAGE_ORDER,
  contactDisplayName,
  formatAmount,
  type DealDetail,
  type DealStage,
} from "./types";

interface DealDetailClientProps {
  deal: DealDetail;
}

const STRING_FIELDS = [
  "title",
  "description",
  "currency",
  "lostReason",
  "source",
  "ownerId",
] as const;
type StringField = (typeof STRING_FIELDS)[number];

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function DealDetailClient({ deal }: DealDetailClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<Record<StringField, string>>(
    () =>
      Object.fromEntries(
        STRING_FIELDS.map((f) => [f, (deal[f] as string | null) ?? ""])
      ) as Record<StringField, string>
  );
  const [stage, setStage] = useState<DealStage>(deal.stage);
  const [amount, setAmount] = useState<string>(deal.amount ?? "");
  const [probability, setProbability] = useState<string>(
    deal.probability != null ? String(deal.probability) : ""
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState<string>(
    toDateInputValue(deal.expectedCloseDate)
  );
  const [closedAt, setClosedAt] = useState<string>(
    toDateInputValue(deal.closedAt)
  );
  const [contactId, setContactId] = useState<string | null>(deal.contactId);
  const [companyId, setCompanyId] = useState<string | null>(deal.companyId);
  const [campaignId, setCampaignId] = useState<string | null>(deal.campaignId);
  const [tags, setTags] = useState(deal.tags);
  const [tagInput, setTagInput] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  async function patchDeal(payload: Record<string, unknown>) {
    const res = await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setSavedAt(new Date());
    return res;
  }

  function debouncedSave(payload: Record<string, unknown>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => patchDeal(payload), 300);
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
    const original = (deal[key] as string | null) ?? "";
    if (form[key] !== original) {
      patchDeal({ [key]: form[key] || null });
    }
  }

  function changeStage(v: DealStage) {
    setStage(v);
    patchDeal({ stage: v });
  }

  function commitAmount() {
    const original = deal.amount ?? "";
    if (amount !== original) {
      patchDeal({ amount: amount === "" ? null : Number(amount) });
    }
  }

  function commitProbability() {
    const original = deal.probability != null ? String(deal.probability) : "";
    if (probability !== original) {
      patchDeal({
        probability: probability === "" ? null : Number(probability),
      });
    }
  }

  function commitExpectedCloseDate() {
    const original = toDateInputValue(deal.expectedCloseDate);
    if (expectedCloseDate !== original) {
      patchDeal({
        expectedCloseDate: expectedCloseDate === "" ? null : expectedCloseDate,
      });
    }
  }

  function commitClosedAt() {
    const original = toDateInputValue(deal.closedAt);
    if (closedAt !== original) {
      patchDeal({ closedAt: closedAt === "" ? null : closedAt });
    }
  }

  function changeContact(id: string | null) {
    setContactId(id);
    patchDeal({ contactId: id });
  }

  function changeCompany(id: string | null) {
    setCompanyId(id);
    patchDeal({ companyId: id });
  }

  function changeCampaign(id: string | null) {
    setCampaignId(id);
    patchDeal({ campaignId: id });
  }

  function handleEditorChange(json: unknown, text: string) {
    debouncedSave({ contentJson: json, contentText: text });
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
    patchDeal({ tags: next });
  }

  function removeTag(t: string) {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    patchDeal({ tags: next });
  }

  async function handleDelete() {
    if (!confirm(`Excluir "${form.title}"?`)) return;
    const res = await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/blocks/deals");
      router.refresh();
    }
  }

  const stageMeta = STAGE_CONFIG[stage];
  const isClosed = stage === "WON" || stage === "LOST";

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/blocks/deals"
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
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          onBlur={() => commitField("title")}
          placeholder="Título da oportunidade"
          className="text-xl font-semibold !border-0 !shadow-none !ring-0 px-0 focus-visible:ring-0"
        />
        <span
          className={`shrink-0 text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${stageMeta.color}`}
        >
          {stageMeta.label}
        </span>
      </div>

      <Section title="Pipeline">
        <Field label="Estágio">
          <Select value={stage} onValueChange={(v) => changeStage(v as DealStage)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={`Valor (${form.currency || "BRL"})`}>
          <Input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={commitAmount}
            placeholder="0.00"
          />
        </Field>
        <Field label="Moeda">
          <Input
            value={form.currency}
            onChange={(e) => setField("currency", e.target.value)}
            onBlur={() => commitField("currency")}
            placeholder="BRL"
          />
        </Field>
        <Field label="Probabilidade (%)">
          <Input
            type="number"
            min={0}
            max={100}
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
            onBlur={commitProbability}
          />
        </Field>
        <Field label="Fechamento esperado">
          <Input
            type="date"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
            onBlur={commitExpectedCloseDate}
          />
        </Field>
        <Field label="Fechado em">
          <Input
            type="date"
            value={closedAt}
            onChange={(e) => setClosedAt(e.target.value)}
            onBlur={commitClosedAt}
          />
        </Field>
        {stage === "LOST" && (
          <Field label="Motivo da perda" full>
            <Input
              value={form.lostReason}
              onChange={(e) => setField("lostReason", e.target.value)}
              onBlur={() => commitField("lostReason")}
            />
          </Field>
        )}
        {!isClosed && deal.amount && deal.probability != null && (
          <Field label="Valor ponderado" full>
            <div className="text-sm text-muted-foreground">
              {formatAmount(
                String(Number(deal.amount) * (deal.probability / 100)),
                deal.currency
              )}
            </div>
          </Field>
        )}
      </Section>

      <Section title="Vínculos">
        <Field label="Empresa" full>
          <CompanyPicker value={companyId} onChange={changeCompany} />
        </Field>
        <Field label="Contato" full>
          <ContactPicker value={contactId} onChange={changeContact} />
        </Field>
        <Field label="Campanha" full>
          <CampaignPicker value={campaignId} onChange={changeCampaign} />
        </Field>
      </Section>

      <Section title="Origem & Owner">
        <Field label="Source">
          <Input
            value={form.source}
            onChange={(e) => setField("source", e.target.value)}
            onBlur={() => commitField("source")}
            placeholder="ex: inbound, referral"
          />
        </Field>
        <Field label="Owner (UUID)">
          <Input
            value={form.ownerId}
            onChange={(e) => setField("ownerId", e.target.value)}
            onBlur={() => commitField("ownerId")}
            placeholder="—"
          />
        </Field>
      </Section>

      <Section title="Descrição">
        <Field label="Descrição curta" full>
          <Input
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            onBlur={() => commitField("description")}
          />
        </Field>
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

      <Section title="Notas">
        <div className="col-span-2">
          <NoteEditor
            initialJson={deal.contentJson}
            onChange={handleEditorChange}
          />
        </div>
      </Section>

      {(deal.contact || deal.company) && (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Vínculos atuais
          </Label>
          <div className="rounded-md border divide-y">
            {deal.company && (
              <Link
                href={`/admin/blocks/companies/${deal.company.id}`}
                className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/50"
              >
                <div className="text-sm">🏢 {deal.company.name}</div>
                <span className="text-xs text-muted-foreground">→</span>
              </Link>
            )}
            {deal.contact && (
              <Link
                href={`/admin/blocks/contacts/${deal.contact.id}`}
                className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/50"
              >
                <div className="text-sm">
                  👤 {contactDisplayName(deal.contact)}
                  {deal.contact.email && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {deal.contact.email}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">→</span>
              </Link>
            )}
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
