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
import { ArrowLeft, Trash2, X } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { NoteEditor } from "@/components/notes/note-editor";
import {
  FORMAT_ORDER,
  STATUS_COLOR,
  STATUS_ORDER,
  type ExperienceFormat,
  type ExperienceRow,
  type ExperienceStatus,
} from "./types";

interface ExperienceDetailClientProps {
  experience: ExperienceRow;
}

const STRING_FIELDS = [
  "name",
  "headline",
  "description",
  "currency",
  "locationName",
  "locationUrl",
  "coverImageUrl",
  "hostId",
] as const;
type StringField = (typeof STRING_FIELDS)[number];

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export function ExperienceDetailClient({
  experience,
}: ExperienceDetailClientProps) {
  const t = useT();
  const router = useRouter();
  const [form, setForm] = useState<Record<StringField, string>>(
    () =>
      Object.fromEntries(
        STRING_FIELDS.map((f) => [f, (experience[f] as string | null) ?? ""])
      ) as Record<StringField, string>
  );
  const [format, setFormat] = useState<ExperienceFormat>(experience.format);
  const [status, setStatus] = useState<ExperienceStatus>(experience.status);
  const [startDate, setStartDate] = useState(toDateInput(experience.startDate));
  const [endDate, setEndDate] = useState(toDateInput(experience.endDate));
  const [duration, setDuration] = useState(
    experience.durationMin != null ? String(experience.durationMin) : ""
  );
  const [capacity, setCapacity] = useState(
    experience.capacity != null ? String(experience.capacity) : ""
  );
  const [price, setPrice] = useState(experience.price ?? "");
  const [tags, setTags] = useState(experience.tags);
  const [tagInput, setTagInput] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  async function patchExperience(payload: Record<string, unknown>) {
    const res = await fetch(`/api/experiences/${experience.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setSavedAt(new Date());
    return res;
  }

  function debouncedSave(payload: Record<string, unknown>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => patchExperience(payload), 300);
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
    const original = (experience[key] as string | null) ?? "";
    if (form[key] !== original) {
      patchExperience({ [key]: form[key] || null });
    }
  }

  function commitDuration() {
    const original = experience.durationMin != null ? String(experience.durationMin) : "";
    if (duration !== original) {
      patchExperience({ durationMin: duration === "" ? null : Number(duration) });
    }
  }
  function commitCapacity() {
    const original = experience.capacity != null ? String(experience.capacity) : "";
    if (capacity !== original) {
      patchExperience({ capacity: capacity === "" ? null : Number(capacity) });
    }
  }
  function commitPrice() {
    const original = experience.price ?? "";
    if (price !== original) {
      patchExperience({ price: price === "" ? null : Number(price) });
    }
  }
  function commitStartDate() {
    const original = toDateInput(experience.startDate);
    if (startDate !== original) {
      patchExperience({ startDate: startDate === "" ? null : startDate });
    }
  }
  function commitEndDate() {
    const original = toDateInput(experience.endDate);
    if (endDate !== original) {
      patchExperience({ endDate: endDate === "" ? null : endDate });
    }
  }

  function changeFormat(v: ExperienceFormat) {
    setFormat(v);
    patchExperience({ format: v });
  }
  function changeStatus(v: ExperienceStatus) {
    setStatus(v);
    patchExperience({ status: v });
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag)) return;
    const next = [...tags, tag];
    setTags(next);
    setTagInput("");
    patchExperience({ tags: next });
  }
  function removeTag(tag: string) {
    const next = tags.filter((x) => x !== tag);
    setTags(next);
    patchExperience({ tags: next });
  }

  function handleEditorChange(json: unknown, text: string) {
    debouncedSave({ contentJson: json, contentText: text });
  }

  async function handleDelete() {
    if (!confirm(t("common.confirmDelete", { name: form.name }))) return;
    const res = await fetch(`/api/experiences/${experience.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/blocks/experiences");
      router.refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/blocks/experiences"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Link>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              {t("common.savedAt", { time: savedAt.toLocaleTimeString() })}
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
          placeholder={t("experiences.fields.name")}
          className="text-xl font-semibold !border-0 !shadow-none !ring-0 px-0 focus-visible:ring-0"
        />
        <span
          className={`shrink-0 text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${STATUS_COLOR[status]}`}
        >
          {t(`experiences.status.${status}`)}
        </span>
      </div>

      <Field label={t("experiences.fields.headline")} full>
        <Input
          value={form.headline}
          onChange={(e) => setField("headline", e.target.value)}
          onBlur={() => commitField("headline")}
        />
      </Field>

      <Section title={t("experiences.fields.format") + " & " + t("experiences.fields.status")}>
        <Field label={t("experiences.fields.format")}>
          <Select value={format} onValueChange={(v) => changeFormat(v as ExperienceFormat)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORMAT_ORDER.map((f) => (
                <SelectItem key={f} value={f}>{t(`experiences.format.${f}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("experiences.fields.status")}>
          <Select value={status} onValueChange={(v) => changeStatus(v as ExperienceStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{t(`experiences.status.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title={t("experiences.fields.startDate")}>
        <Field label={t("experiences.fields.startDate")}>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} onBlur={commitStartDate} />
        </Field>
        <Field label={t("experiences.fields.endDate")}>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} onBlur={commitEndDate} />
        </Field>
        <Field label={t("experiences.fields.duration")}>
          <Input type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} onBlur={commitDuration} />
        </Field>
        <Field label={t("experiences.fields.capacity")}>
          <Input type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)} onBlur={commitCapacity} />
        </Field>
      </Section>

      <Section title={t("experiences.fields.location")}>
        <Field label={t("experiences.fields.location")} full>
          <Input value={form.locationName} onChange={(e) => setField("locationName", e.target.value)} onBlur={() => commitField("locationName")} />
        </Field>
        <Field label="URL" full>
          <Input value={form.locationUrl} onChange={(e) => setField("locationUrl", e.target.value)} onBlur={() => commitField("locationUrl")} placeholder="https://" />
        </Field>
      </Section>

      <Section title={t("experiences.fields.price")}>
        <Field label={t("experiences.fields.currency")}>
          <Input value={form.currency} onChange={(e) => setField("currency", e.target.value)} onBlur={() => commitField("currency")} placeholder="BRL" />
        </Field>
        <Field label={t("experiences.fields.price")}>
          <Input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} onBlur={commitPrice} placeholder="0.00" />
        </Field>
      </Section>

      <Section title={t("experiences.fields.coverImage")}>
        <Field label={t("experiences.fields.coverImage")} full>
          <Input value={form.coverImageUrl} onChange={(e) => setField("coverImageUrl", e.target.value)} onBlur={() => commitField("coverImageUrl")} placeholder="https://" />
        </Field>
        <Field label={t("experiences.fields.host")} full>
          <Input value={form.hostId} onChange={(e) => setField("hostId", e.target.value)} onBlur={() => commitField("hostId")} placeholder="—" />
        </Field>
      </Section>

      <Section title={t("experiences.fields.description")}>
        <div className="col-span-2">
          <Textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            onBlur={() => commitField("description")}
            rows={3}
          />
        </div>
      </Section>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("experiences.fields.tags")}
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-destructive">
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
            placeholder={t("common.tags.add")}
            className="h-7 w-40 text-xs"
          />
        </div>
      </div>

      <Section title={t("common.notes")}>
        <div className="col-span-2">
          <NoteEditor initialJson={experience.contentJson} onChange={handleEditorChange} />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1 ${full ? "col-span-2" : ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
