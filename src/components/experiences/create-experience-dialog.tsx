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
import { useT } from "@/lib/i18n/locale-context";
import {
  FORMAT_ORDER,
  STATUS_ORDER,
  type ExperienceFormat,
  type ExperienceStatus,
} from "./types";

export function CreateExperienceDialog() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<ExperienceFormat>("IN_PERSON");
  const [status, setStatus] = useState<ExperienceStatus>("DRAFT");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        format,
        status,
      };
      if (price.trim()) body.price = Number(price);
      const res = await fetch("/api/experiences", {
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
      setFormat("IN_PERSON");
      setStatus("DRAFT");
      setPrice("");
      router.push(`/admin/blocks/experiences/${json.data.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t("experiences.create")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("experiences.create")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-name">{t("experiences.fields.name")}</Label>
              <Input
                id="exp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="exp-format">{t("experiences.fields.format")}</Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as ExperienceFormat)}
                >
                  <SelectTrigger id="exp-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_ORDER.map((f) => (
                      <SelectItem key={f} value={f}>
                        {t(`experiences.format.${f}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exp-status">{t("experiences.fields.status")}</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ExperienceStatus)}
                >
                  <SelectTrigger id="exp-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`experiences.status.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-price">{t("experiences.fields.price")}</Label>
              <Input
                id="exp-price"
                type="number"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
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
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || submitting}>
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
