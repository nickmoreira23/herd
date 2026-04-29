"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import {
  PRICING_TYPE_CONFIG,
  type ServicePricingType,
} from "./types";

export function CreateServiceDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [pricingType, setPricingType] = useState<ServicePricingType>("FIXED");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        pricingType,
      };
      if (category.trim()) body.category = category.trim();
      if (price.trim() && pricingType !== "CUSTOM") {
        const n = parseFloat(price.replace(",", "."));
        if (!Number.isNaN(n)) body.price = n;
      }
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error(json);
        return;
      }
      setOpen(false);
      setName("");
      setCategory("");
      setPrice("");
      setPricingType("FIXED");
      router.push(`/admin/blocks/services/${json.data.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Novo serviço
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="svc-name">Nome</Label>
              <Input
                id="svc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-category">Categoria</Label>
              <Input
                id="svc-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="ex: consultoria, treinamento"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="svc-pricing">Tipo de cobrança</Label>
                <Select
                  value={pricingType}
                  onValueChange={(v) =>
                    setPricingType(v as ServicePricingType)
                  }
                >
                  <SelectTrigger id="svc-pricing">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRICING_TYPE_CONFIG).map(([k, cfg]) => (
                      <SelectItem key={k} value={k}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="svc-price">Preço (R$)</Label>
                <Input
                  id="svc-price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={pricingType === "CUSTOM"}
                  placeholder={pricingType === "CUSTOM" ? "Sob consulta" : "0,00"}
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || submitting}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
