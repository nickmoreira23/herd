"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCATION_TYPE_OPTIONS, type LocationRow } from "./types";

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: LocationRow | null;
  onSaved: (location: LocationRow) => void;
}

const EMPTY = {
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
  isActive: true,
  notes: "",
};

export function LocationDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: LocationDialogProps) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              type: initial.type,
              street: initial.street ?? "",
              street2: initial.street2 ?? "",
              city: initial.city ?? "",
              state: initial.state ?? "",
              zip: initial.zip ?? "",
              country: initial.country ?? "",
              phone: initial.phone ?? "",
              email: initial.email ?? "",
              isHeadquarters: initial.isHeadquarters,
              isActive: initial.isActive,
              notes: initial.notes ?? "",
            }
          : EMPTY
      );
    }
  }, [open, initial]);

  function setField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = initial ? `/api/locations/${initial.id}` : "/api/locations";
      const res = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error(json);
        return;
      }
      onSaved(json.data);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Editar localização" : "Nova localização"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="loc-name">Nome</Label>
              <Input
                id="loc-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="loc-type">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setField("type", v)}
              >
                <SelectTrigger id="loc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="loc-street">Endereço</Label>
              <Input
                id="loc-street"
                value={form.street}
                onChange={(e) => setField("street", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="loc-street2">Complemento</Label>
              <Input
                id="loc-street2"
                value={form.street2}
                onChange={(e) => setField("street2", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-city">Cidade</Label>
              <Input
                id="loc-city"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-state">Estado</Label>
              <Input
                id="loc-state"
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-zip">CEP</Label>
              <Input
                id="loc-zip"
                value={form.zip}
                onChange={(e) => setField("zip", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-country">País</Label>
              <Input
                id="loc-country"
                value={form.country}
                onChange={(e) => setField("country", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-phone">Telefone</Label>
              <Input
                id="loc-phone"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-email">E-mail</Label>
              <Input
                id="loc-email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="loc-notes">Observações</Label>
              <Textarea
                id="loc-notes"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex items-center gap-6 pt-1">
            <div className="flex items-center gap-2">
              <Switch
                id="loc-hq"
                checked={form.isHeadquarters}
                onCheckedChange={(v) => setField("isHeadquarters", v)}
              />
              <Label htmlFor="loc-hq" className="text-sm">
                Sede
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="loc-active"
                checked={form.isActive}
                onCheckedChange={(v) => setField("isActive", v)}
              />
              <Label htmlFor="loc-active" className="text-sm">
                Ativa
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
          >
            {initial ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
