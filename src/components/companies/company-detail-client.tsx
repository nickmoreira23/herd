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
import { ArrowLeft, Trash2, X } from "lucide-react";
import {
  SIZE_CONFIG,
  type CompanyDetail,
  type CompanySize,
} from "./types";

interface CompanyDetailClientProps {
  company: CompanyDetail;
}

const STRING_FIELDS = [
  "name",
  "legalName",
  "taxId",
  "website",
  "domain",
  "logoUrl",
  "industry",
  "email",
  "phone",
  "linkedinUrl",
  "twitterHandle",
  "street",
  "street2",
  "city",
  "state",
  "zip",
  "country",
  "description",
  "ownerId",
] as const;

type StringField = (typeof STRING_FIELDS)[number];

export function CompanyDetailClient({ company }: CompanyDetailClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<Record<StringField, string>>(
    () =>
      Object.fromEntries(
        STRING_FIELDS.map((f) => [f, (company[f] as string | null) ?? ""])
      ) as Record<StringField, string>
  );
  const [size, setSize] = useState<CompanySize | "">(company.size ?? "");
  const [tags, setTags] = useState(company.tags);
  const [tagInput, setTagInput] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  async function patchCompany(payload: Record<string, unknown>) {
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setSavedAt(new Date());
    return res;
  }

  function debouncedSave(payload: Record<string, unknown>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => patchCompany(payload), 300);
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
    const original = (company[key] as string | null) ?? "";
    if (form[key] !== original) {
      patchCompany({ [key]: form[key] || null });
    }
  }

  function changeSize(v: CompanySize | "") {
    setSize(v);
    patchCompany({ size: v || null });
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
    patchCompany({ tags: next });
  }

  function removeTag(t: string) {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    patchCompany({ tags: next });
  }

  async function handleDelete() {
    if (
      !confirm(
        `Excluir "${form.name}"? Os contatos vinculados serão desvinculados (não deletados).`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/blocks/companies");
      router.refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/blocks/companies"
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

      <Input
        value={form.name}
        onChange={(e) => setField("name", e.target.value)}
        onBlur={() => commitField("name")}
        placeholder="Nome da empresa"
        className="text-xl font-semibold !border-0 !shadow-none !ring-0 px-0 focus-visible:ring-0"
      />

      <Section title="Identificação">
        <Field label="Razão social" full>
          <Input
            value={form.legalName}
            onChange={(e) => setField("legalName", e.target.value)}
            onBlur={() => commitField("legalName")}
          />
        </Field>
        <Field label="CNPJ / Tax ID">
          <Input
            value={form.taxId}
            onChange={(e) => setField("taxId", e.target.value)}
            onBlur={() => commitField("taxId")}
          />
        </Field>
        <Field label="Website">
          <Input
            value={form.website}
            onChange={(e) => setField("website", e.target.value)}
            onBlur={() => commitField("website")}
          />
        </Field>
        <Field label="Domínio">
          <Input
            value={form.domain}
            onChange={(e) => setField("domain", e.target.value)}
            onBlur={() => commitField("domain")}
            placeholder="empresa.com"
          />
        </Field>
        <Field label="URL do logo">
          <Input
            value={form.logoUrl}
            onChange={(e) => setField("logoUrl", e.target.value)}
            onBlur={() => commitField("logoUrl")}
          />
        </Field>
      </Section>

      <Section title="Segmentação">
        <Field label="Setor / Indústria">
          <Input
            value={form.industry}
            onChange={(e) => setField("industry", e.target.value)}
            onBlur={() => commitField("industry")}
          />
        </Field>
        <Field label="Tamanho">
          <Select
            value={size || "_none"}
            onValueChange={(v) => changeSize(v === "_none" ? "" : (v as CompanySize))}
          >
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">—</SelectItem>
              {Object.entries(SIZE_CONFIG).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title="Contato corporativo">
        <Field label="E-mail">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() => commitField("email")}
          />
        </Field>
        <Field label="Telefone">
          <Input
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            onBlur={() => commitField("phone")}
          />
        </Field>
        <Field label="LinkedIn">
          <Input
            value={form.linkedinUrl}
            onChange={(e) => setField("linkedinUrl", e.target.value)}
            onBlur={() => commitField("linkedinUrl")}
          />
        </Field>
        <Field label="Twitter (@handle)">
          <Input
            value={form.twitterHandle}
            onChange={(e) => setField("twitterHandle", e.target.value)}
            onBlur={() => commitField("twitterHandle")}
          />
        </Field>
      </Section>

      <Section title="Endereço">
        <Field label="Rua" full>
          <Input
            value={form.street}
            onChange={(e) => setField("street", e.target.value)}
            onBlur={() => commitField("street")}
          />
        </Field>
        <Field label="Complemento" full>
          <Input
            value={form.street2}
            onChange={(e) => setField("street2", e.target.value)}
            onBlur={() => commitField("street2")}
          />
        </Field>
        <Field label="Cidade">
          <Input
            value={form.city}
            onChange={(e) => setField("city", e.target.value)}
            onBlur={() => commitField("city")}
          />
        </Field>
        <Field label="Estado">
          <Input
            value={form.state}
            onChange={(e) => setField("state", e.target.value)}
            onBlur={() => commitField("state")}
          />
        </Field>
        <Field label="CEP">
          <Input
            value={form.zip}
            onChange={(e) => setField("zip", e.target.value)}
            onBlur={() => commitField("zip")}
          />
        </Field>
        <Field label="País">
          <Input
            value={form.country}
            onChange={(e) => setField("country", e.target.value)}
            onBlur={() => commitField("country")}
          />
        </Field>
      </Section>

      <Section title="Owner">
        <Field label="Owner (UUID)" full>
          <Input
            value={form.ownerId}
            onChange={(e) => setField("ownerId", e.target.value)}
            onBlur={() => commitField("ownerId")}
            placeholder="—"
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
            initialJson={company.contentJson}
            onChange={handleEditorChange}
          />
        </div>
      </Section>

      {company.contacts && company.contacts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Contatos vinculados ({company.contacts.length})
          </Label>
          <div className="rounded-md border divide-y">
            {company.contacts.map((c) => (
              <Link
                key={c.id}
                href={`/admin/blocks/contacts/${c.id}`}
                className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {c.firstName}
                    {c.lastName ? " " + c.lastName : ""}
                  </div>
                  {(c.jobTitle || c.email) && (
                    <div className="text-xs text-muted-foreground truncate">
                      {c.jobTitle}
                      {c.jobTitle && c.email ? " · " : ""}
                      {c.email}
                    </div>
                  )}
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
