"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Trash2 } from "lucide-react";
import { LOCATION_TYPE_OPTIONS, formatAddress, type LocationRow } from "./types";
import { useT } from "@/lib/i18n/locale-context";

interface LocationDetailClientProps {
  location: LocationRow;
}

const STRING_FIELDS = [
  "name",
  "street",
  "street2",
  "city",
  "state",
  "zip",
  "country",
  "phone",
  "email",
  "notes",
] as const;
type StringField = (typeof STRING_FIELDS)[number];

export function LocationDetailClient({ location }: LocationDetailClientProps) {
  const t = useT();
  const router = useRouter();
  const [form, setForm] = useState<Record<StringField, string>>(
    () =>
      Object.fromEntries(
        STRING_FIELDS.map((f) => [f, (location[f] as string | null) ?? ""])
      ) as Record<StringField, string>
  );
  const [type, setType] = useState(location.type);
  const [isHeadquarters, setIsHeadquarters] = useState(location.isHeadquarters);
  const [isActive, setIsActive] = useState(location.isActive);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  async function patchLocation(payload: Record<string, unknown>) {
    const res = await fetch(`/api/locations/${location.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setSavedAt(new Date());
    return res;
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
    const original = (location[key] as string | null) ?? "";
    if (form[key] !== original) {
      patchLocation({ [key]: form[key] || null });
    }
  }

  function changeType(v: string) {
    setType(v);
    patchLocation({ type: v });
  }

  function changeHeadquarters(v: boolean) {
    setIsHeadquarters(v);
    patchLocation({ isHeadquarters: v });
  }

  function changeActive(v: boolean) {
    setIsActive(v);
    patchLocation({ isActive: v });
  }

  async function handleDelete() {
    if (!confirm(t("organization.locations.delete_confirm", { name: form.name }))) return;
    const res = await fetch(`/api/locations/${location.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/blocks/locations");
      router.refresh();
    }
  }

  const previewAddress = formatAddress({
    ...location,
    street: form.street || null,
    street2: form.street2 || null,
    city: form.city || null,
    state: form.state || null,
    zip: form.zip || null,
    country: form.country || null,
  });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/blocks/locations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.actions.back")}
        </Link>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              {t("organization.locations.saved_at", {
                time: savedAt.toLocaleTimeString(),
              })}
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
        placeholder={t("organization.locations.field.name")}
        className="text-xl font-semibold !border-0 !shadow-none !ring-0 px-0 focus-visible:ring-0"
      />

      <Section title={t("organization.locations.section.identification")}>
        <Field label={t("organization.locations.field.type")}>
          <Select value={type} onValueChange={changeType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("organization.locations.field.is_headquarters_label")}>
          <div className="flex items-center gap-2 h-9">
            <Switch
              checked={isHeadquarters}
              onCheckedChange={changeHeadquarters}
            />
            <span className="text-xs text-muted-foreground">
              {t("organization.locations.hq_hint")}
            </span>
          </div>
        </Field>
        <Field label={t("organization.locations.field.is_active")}>
          <div className="flex items-center gap-2 h-9">
            <Switch checked={isActive} onCheckedChange={changeActive} />
            <span className="text-xs text-muted-foreground">
              {isActive
                ? t("organization.locations.active_in_use")
                : t("organization.locations.archived")}
            </span>
          </div>
        </Field>
      </Section>

      <Section title={t("organization.locations.section.address")}>
        <Field label={t("organization.locations.field.street")} full>
          <Input
            value={form.street}
            onChange={(e) => setField("street", e.target.value)}
            onBlur={() => commitField("street")}
          />
        </Field>
        <Field label={t("organization.locations.field.street2")} full>
          <Input
            value={form.street2}
            onChange={(e) => setField("street2", e.target.value)}
            onBlur={() => commitField("street2")}
          />
        </Field>
        <Field label={t("organization.locations.field.city")}>
          <Input
            value={form.city}
            onChange={(e) => setField("city", e.target.value)}
            onBlur={() => commitField("city")}
          />
        </Field>
        <Field label={t("organization.locations.field.state")}>
          <Input
            value={form.state}
            onChange={(e) => setField("state", e.target.value)}
            onBlur={() => commitField("state")}
          />
        </Field>
        <Field label={t("organization.locations.field.zip")}>
          <Input
            value={form.zip}
            onChange={(e) => setField("zip", e.target.value)}
            onBlur={() => commitField("zip")}
          />
        </Field>
        <Field label={t("organization.locations.field.country")}>
          <Input
            value={form.country}
            onChange={(e) => setField("country", e.target.value)}
            onBlur={() => commitField("country")}
          />
        </Field>
        {previewAddress && (
          <div className="col-span-2 text-xs text-muted-foreground">
            📍 {previewAddress}
          </div>
        )}
      </Section>

      <Section title={t("organization.locations.section.contact")}>
        <Field label={t("organization.locations.field.phone")}>
          <Input
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            onBlur={() => commitField("phone")}
          />
        </Field>
        <Field label={t("organization.locations.field.email")}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() => commitField("email")}
          />
        </Field>
      </Section>

      <Section title={t("organization.locations.section.notes")}>
        <div className="col-span-2">
          <Textarea
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            onBlur={() => commitField("notes")}
            rows={4}
            placeholder={t("organization.locations.field.notes_placeholder")}
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
