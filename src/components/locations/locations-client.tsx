"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationCard } from "./location-card";
import { LocationDialog } from "./location-dialog";
import { LOCATION_TYPE_OPTIONS, type LocationRow } from "./types";
import { MapPin, Plus } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface LocationsClientProps {
  initialLocations: LocationRow[];
}

export function LocationsClient({ initialLocations }: LocationsClientProps) {
  const t = useT();
  const [locations, setLocations] = useState(initialLocations);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LocationRow | null>(null);

  const filtered = useMemo(() => {
    return locations.filter((l) => {
      if (typeFilter !== "all" && l.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          (l.city?.toLowerCase().includes(q) ?? false) ||
          (l.state?.toLowerCase().includes(q) ?? false) ||
          (l.country?.toLowerCase().includes(q) ?? false) ||
          (l.street?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [locations, search, typeFilter]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(loc: LocationRow) {
    setEditing(loc);
    setDialogOpen(true);
  }

  function handleSaved(saved: LocationRow) {
    setLocations((prev) => {
      // when isHeadquarters is set, others get unset server-side — refetch is simplest
      const unsetOthers = saved.isHeadquarters
        ? prev.map((l) =>
            l.id === saved.id ? l : { ...l, isHeadquarters: false }
          )
        : prev;
      const exists = unsetOthers.some((l) => l.id === saved.id);
      const next = exists
        ? unsetOthers.map((l) => (l.id === saved.id ? saved : l))
        : [saved, ...unsetOthers];
      return next.sort((a, b) => {
        if (a.isHeadquarters !== b.isHeadquarters)
          return a.isHeadquarters ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    });
  }

  async function handleDelete(loc: LocationRow) {
    if (!confirm(t("organization.locations.delete_confirm", { name: loc.name }))) return;
    const res = await fetch(`/api/locations/${loc.id}`, { method: "DELETE" });
    if (res.ok) {
      setLocations((prev) => prev.filter((l) => l.id !== loc.id));
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("organization.locations.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("organization.locations.description")}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("organization.locations.add")}
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder={t("organization.locations.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("organization.locations.filter_all_types")}</SelectItem>
            {LOCATION_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {t(o.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center gap-2 py-16 border border-dashed rounded-lg">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">{t("organization.locations.not_found")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("organization.locations.not_found_hint")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((l) => (
            <LocationCard
              key={l.id}
              location={l}
              onEdit={() => openEdit(l)}
              onDelete={() => handleDelete(l)}
            />
          ))}
        </div>
      )}

      <LocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
