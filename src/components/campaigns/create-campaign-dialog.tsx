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
  STATUS_CONFIG,
  STATUS_ORDER,
  OBJECTIVE_CONFIG,
  OBJECTIVE_ORDER,
  type CampaignObjective,
  type CampaignStatus,
} from "./types";

export function CreateCampaignDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("DRAFT");
  const [objective, setObjective] = useState<CampaignObjective | "">("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        status,
      };
      if (objective) body.objective = objective;
      if (budget.trim()) body.budget = Number(budget);
      const res = await fetch("/api/campaigns", {
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
      setStatus("DRAFT");
      setObjective("");
      setBudget("");
      router.push(`/admin/blocks/campaigns/${json.data.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nova campanha
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cmp-name">Nome</Label>
              <Input
                id="cmp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="cmp-status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as CampaignStatus)}
                >
                  <SelectTrigger id="cmp-status">
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
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cmp-obj">Objetivo</Label>
                <Select
                  value={objective || "_none"}
                  onValueChange={(v) =>
                    setObjective(v === "_none" ? "" : (v as CampaignObjective))
                  }
                >
                  <SelectTrigger id="cmp-obj">
                    <SelectValue />
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
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cmp-budget">Orçamento (BRL)</Label>
              <Input
                id="cmp-budget"
                type="number"
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.00"
              />
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
