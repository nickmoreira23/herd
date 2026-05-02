"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/t";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import { PageHeader } from "@/components/layout/page-header";
import {
  Plus,
  MapPin,
  Building2,
  Store,
  Warehouse,
  Pencil,
  Trash2,
} from "lucide-react";

interface Location {
  id: string;
  name: string;
  type: string;
  street: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  isHeadquarters: boolean;
  isActive: boolean;
  notes: string | null;
}

const LOCATION_TYPE_VALUES = [
  "headquarters",
  "office",
  "store",
  "warehouse",
  "other",
] as const;
type LocationTypeValue = (typeof LOCATION_TYPE_VALUES)[number];

const LOCATION_TYPE_KEYS = {
  headquarters: "organization.locations.type.headquarters",
  office: "organization.locations.type.office",
  store: "organization.locations.type.store",
  warehouse: "organization.locations.type.warehouse",
  other: "organization.locations.type.other",
} as const satisfies Record<LocationTypeValue, MessageKey>;

const EMPTY_FORM: Omit<Location, "id" | "isActive"> = {
  name: "",
  type: "office",
  street: "",
  street2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  phone: "",
  email: "",
  isHeadquarters: false,
  notes: "",
};

function getTypeIcon(type: string) {
  switch (type) {
    case "headquarters":
      return Building2;
    case "store":
      return Store;
    case "warehouse":
      return Warehouse;
    default:
      return MapPin;
  }
}

function formatAddress(loc: Location, fallback: string): string {
  const parts = [loc.street, loc.street2, loc.city, loc.state, loc.zip].filter(
    Boolean
  );
  if (loc.country) parts.push(loc.country);
  return parts.join(", ") || fallback;
}

interface LocationsFormProps {
  locale: Locale;
}

export function LocationsForm({ locale: _locale }: LocationsFormProps) {
  const t = useT();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations");
      if (res.ok) {
        const json = await res.json();
        setLocations(json.data?.locations || []);
      }
    } catch {
      notifyError("error.organization.locations_load_failed", t);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const setField = useCallback(
    (key: string, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (loc: Location) => {
    setEditingId(loc.id);
    setForm({
      name: loc.name,
      type: loc.type,
      street: loc.street || "",
      street2: loc.street2 || "",
      city: loc.city || "",
      state: loc.state || "",
      zip: loc.zip || "",
      country: loc.country || "",
      phone: loc.phone || "",
      email: loc.email || "",
      isHeadquarters: loc.isHeadquarters,
      notes: loc.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      notifyError("error.organization.location_name_required", t);
      return;
    }

    setSaving(true);
    try {
      const isHQ = form.type === "headquarters" || form.isHeadquarters;
      const payload = { ...form, isHeadquarters: isHQ };

      const res = editingId
        ? await fetch(`/api/locations/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/locations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        notifyError("error.organization.location_save_failed", t);
        return;
      }

      notifySuccess(
        editingId
          ? "organization.feedback.location_updated"
          : "organization.feedback.location_added",
        t,
      );
      setDialogOpen(false);
      fetchLocations();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        notifyError("error.organization.location_delete_failed", t);
        return;
      }
      notifySuccess("organization.feedback.location_deleted", t);
      fetchLocations();
    } catch {
      notifyError("error.organization.location_delete_failed", t);
    }
  };

  const headquarters = locations.filter((l) => l.isHeadquarters);
  const otherLocations = locations.filter((l) => !l.isHeadquarters);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("organization.locations.title")}
        description={t("organization.locations.description")}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t("organization.locations.add")}
          </Button>
        }
      />

      <div className="max-w-[800px] mx-auto space-y-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MapPin className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold">
                {t("organization.locations.empty_title")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4 text-center max-w-sm">
                {t("organization.locations.empty_description")}
              </p>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1.5" />
                {t("organization.locations.add_first")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Headquarters */}
            {headquarters.length > 0 && (
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>
                    {t("organization.locations.headquarters_title")}
                  </CardTitle>
                  <CardDescription>
                    {t("organization.locations.headquarters_description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  {headquarters.map((loc) => (
                    <LocationRow
                      key={loc.id}
                      location={loc}
                      onEdit={() => openEdit(loc)}
                      onDelete={() => handleDelete(loc.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Other Locations */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle>
                  {headquarters.length > 0
                    ? t("organization.locations.other_title")
                    : t("organization.locations.all_title")}
                </CardTitle>
                <CardDescription>
                  {t("organization.locations.other_description")}
                </CardDescription>
              </CardHeader>
              {otherLocations.length === 0 ? (
                <CardContent>
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {t("organization.locations.other_empty")}
                  </p>
                </CardContent>
              ) : (
                <CardContent className="divide-y divide-border">
                  {otherLocations.map((loc) => (
                    <LocationRow
                      key={loc.id}
                      location={loc}
                      onEdit={() => openEdit(loc)}
                      onDelete={() => handleDelete(loc.id)}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          </>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t("organization.locations.dialog.edit_title")
                : t("organization.locations.dialog.add_title")}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? t("organization.locations.dialog.edit_description")
                : t("organization.locations.dialog.add_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("organization.locations.field.name")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder={t(
                    "organization.locations.field.name_placeholder",
                  )}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("organization.locations.field.type")}</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setField("type", val ?? "office")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPE_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(LOCATION_TYPE_KEYS[value])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.isHeadquarters || form.type === "headquarters"}
                onCheckedChange={(checked) =>
                  setField("isHeadquarters", checked)
                }
              />
              <Label className="font-normal">
                {t("organization.locations.field.is_headquarters")}
              </Label>
            </div>

            <div>
              <Label>{t("organization.locations.field.street")}</Label>
              <Input
                value={form.street || ""}
                onChange={(e) => setField("street", e.target.value)}
                placeholder={t(
                  "organization.locations.field.street_placeholder",
                )}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("organization.locations.field.street2")}</Label>
              <Input
                value={form.street2 || ""}
                onChange={(e) => setField("street2", e.target.value)}
                placeholder={t(
                  "organization.locations.field.street2_placeholder",
                )}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t("organization.locations.field.city")}</Label>
                <Input
                  value={form.city || ""}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder={t(
                    "organization.locations.field.city_placeholder",
                  )}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("organization.locations.field.state")}</Label>
                <Input
                  value={form.state || ""}
                  onChange={(e) => setField("state", e.target.value)}
                  placeholder={t(
                    "organization.locations.field.state_placeholder",
                  )}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("organization.locations.field.zip")}</Label>
                <Input
                  value={form.zip || ""}
                  onChange={(e) => setField("zip", e.target.value)}
                  placeholder={t(
                    "organization.locations.field.zip_placeholder",
                  )}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label>{t("organization.locations.field.country")}</Label>
              <Input
                value={form.country || ""}
                onChange={(e) => setField("country", e.target.value)}
                placeholder={t(
                  "organization.locations.field.country_placeholder",
                )}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("organization.locations.field.phone")}</Label>
                <Input
                  value={form.phone || ""}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder={t(
                    "organization.locations.field.phone_placeholder",
                  )}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("organization.locations.field.email")}</Label>
                <Input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder={t(
                    "organization.locations.field.email_placeholder",
                  )}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label>{t("organization.locations.field.notes")}</Label>
              <Textarea
                value={form.notes || ""}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder={t(
                  "organization.locations.field.notes_placeholder",
                )}
                rows={2}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t("common.actions.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving
                  ? t("common.states.saving")
                  : editingId
                    ? t("organization.locations.action.update")
                    : t("organization.locations.action.add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Location Row ──────────────────────────────────────────────────────

function LocationRow({
  location,
  onEdit,
  onDelete,
}: {
  location: Location;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const Icon = getTypeIcon(location.type);
  const typeKey = (LOCATION_TYPE_KEYS as Record<string, MessageKey>)[location.type];
  const typeLabel = typeKey ? t(typeKey) : location.type;

  return (
    <div className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{location.name}</span>
          <Badge variant="secondary" className="text-[10px]">
            {typeLabel}
          </Badge>
          {location.isHeadquarters && (
            <Badge className="text-[10px]">
              {t("organization.locations.hq_badge")}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatAddress(location, t("organization.locations.no_address"))}
        </p>
        {location.phone && (
          <p className="text-xs text-muted-foreground">{location.phone}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
