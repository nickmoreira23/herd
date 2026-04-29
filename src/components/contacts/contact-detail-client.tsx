"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { NoteEditor } from "@/components/notes/note-editor";
import { CompanyPicker } from "@/components/companies/company-picker";
import { ArrowLeft, Trash2, X } from "lucide-react";
import { TAG_SUGGESTIONS, displayName, initials, type ContactRow } from "./types";

interface ContactDetailClientProps {
  contact: ContactRow;
}

const STRING_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "avatarUrl",
  "jobTitle",
  "department",
  "source",
  "street",
  "street2",
  "city",
  "state",
  "zip",
  "country",
  "linkedinUrl",
  "twitterHandle",
  "companyId",
  "ownerId",
] as const;

type StringField = (typeof STRING_FIELDS)[number];

export function ContactDetailClient({ contact }: ContactDetailClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<Record<StringField, string>>(() =>
    Object.fromEntries(
      STRING_FIELDS.map((f) => [f, (contact[f] as string | null) ?? ""])
    ) as Record<StringField, string>
  );
  const [birthday, setBirthday] = useState(
    contact.birthday ? contact.birthday.slice(0, 10) : ""
  );
  const [tags, setTags] = useState(contact.tags);
  const [tagInput, setTagInput] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  async function patchContact(payload: Record<string, unknown>) {
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setSavedAt(new Date());
    return res;
  }

  function debouncedSave(payload: Record<string, unknown>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => patchContact(payload), 300);
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
    const original = (contact[key] as string | null) ?? "";
    if (form[key] !== original) {
      patchContact({ [key]: form[key] || null });
    }
  }

  function commitBirthday() {
    const original = contact.birthday ? contact.birthday.slice(0, 10) : "";
    if (birthday !== original) {
      patchContact({ birthday: birthday || null });
    }
  }

  function handleEditorChange(json: unknown, text: string) {
    debouncedSave({ contentJson: json, contentText: text });
  }

  function addTag(t?: string) {
    const tag = (t ?? tagInput).trim();
    if (!tag || tags.includes(tag)) return;
    const next = [...tags, tag];
    setTags(next);
    setTagInput("");
    patchContact({ tags: next });
  }

  function removeTag(t: string) {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    patchContact({ tags: next });
  }

  async function handleDelete() {
    const dn = displayName({
      firstName: form.firstName,
      lastName: form.lastName || null,
    });
    if (!confirm(`Excluir "${dn}"?`)) return;
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/blocks/contacts");
      router.refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/blocks/contacts"
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

      {/* Header */}
      <div className="flex items-start gap-4">
        {form.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.avatarUrl}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground">
            {initials({ firstName: form.firstName, lastName: form.lastName || null })}
          </div>
        )}
        <div className="flex-1 grid grid-cols-2 gap-2">
          <Input
            value={form.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            onBlur={() => commitField("firstName")}
            placeholder="Nome"
          />
          <Input
            value={form.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            onBlur={() => commitField("lastName")}
            placeholder="Sobrenome"
          />
        </div>
      </div>

      <Section title="Identidade">
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
        <Field label="URL do avatar" full>
          <Input
            value={form.avatarUrl}
            onChange={(e) => setField("avatarUrl", e.target.value)}
            onBlur={() => commitField("avatarUrl")}
          />
        </Field>
      </Section>

      <Section title="Profissional">
        <Field label="Cargo">
          <Input
            value={form.jobTitle}
            onChange={(e) => setField("jobTitle", e.target.value)}
            onBlur={() => commitField("jobTitle")}
          />
        </Field>
        <Field label="Departamento">
          <Input
            value={form.department}
            onChange={(e) => setField("department", e.target.value)}
            onBlur={() => commitField("department")}
          />
        </Field>
        <Field label="Empresa">
          <CompanyPicker
            value={form.companyId || null}
            onChange={(id) => {
              setField("companyId", id ?? "");
              patchContact({ companyId: id });
            }}
          />
        </Field>
      </Section>

      <Section title="Origem & Owner">
        <Field label="Canal de origem">
          <Input
            value={form.source}
            onChange={(e) => setField("source", e.target.value)}
            onBlur={() => commitField("source")}
            placeholder="ex: website, indicação"
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

      <Section title="Social">
        <Field label="Aniversário">
          <Input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            onBlur={commitBirthday}
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

      {/* Tags */}
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
        <div className="flex flex-wrap gap-1">
          {TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).map((s) => (
            <button
              key={s}
              onClick={() => addTag(s)}
              className="text-[10px] text-muted-foreground hover:text-foreground underline"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      <Section title="Notas">
        <div className="col-span-2">
          <NoteEditor
            initialJson={contact.contentJson}
            onChange={handleEditorChange}
          />
        </div>
      </Section>
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
