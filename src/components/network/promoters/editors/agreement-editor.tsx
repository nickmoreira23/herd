"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Shield } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

interface AgreementData {
  id: string;
  name: string;
  status: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  payoutCadence: string;
  holdPeriodDays: number;
  notes: string | null;
  partner: { id: string; name: string };
  commissionPlan: { id: string; name: string; version: number };
  clawbackRules: { windowDays: number; clawbackPercent: number }[];
}

interface AgreementEditorProps {
  agreement?: AgreementData | null;
  partners: { id: string; name: string }[];
  plans: { id: string; name: string; version: number }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function AgreementEditor({ agreement, partners, plans, open, onOpenChange, onSaved }: AgreementEditorProps) {
  const t = useT();
  const [form, setForm] = useState({
    name: "", d2dPartnerId: "", commissionPlanId: "", status: "DRAFT",
    payoutCadence: "MONTHLY", holdPeriodDays: "30", effectiveFrom: "", effectiveTo: "", notes: "",
  });
  const [clawbackRules, setClawbackRules] = useState<{ windowDays: string; clawbackPercent: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agreement) {
      setForm({
        name: agreement.name,
        d2dPartnerId: agreement.partner.id,
        commissionPlanId: agreement.commissionPlan.id,
        status: agreement.status,
        payoutCadence: agreement.payoutCadence,
        holdPeriodDays: String(agreement.holdPeriodDays),
        effectiveFrom: agreement.effectiveFrom ? agreement.effectiveFrom.split("T")[0] : "",
        effectiveTo: agreement.effectiveTo ? agreement.effectiveTo.split("T")[0] : "",
        notes: agreement.notes || "",
      });
      setClawbackRules(agreement.clawbackRules.map(r => ({ windowDays: String(r.windowDays), clawbackPercent: String(r.clawbackPercent) })));
    } else {
      setForm({ name: "", d2dPartnerId: "", commissionPlanId: "", status: "DRAFT", payoutCadence: "MONTHLY", holdPeriodDays: "30", effectiveFrom: "", effectiveTo: "", notes: "" });
      setClawbackRules([{ windowDays: "30", clawbackPercent: "100" }]);
    }
  }, [agreement, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        holdPeriodDays: parseInt(form.holdPeriodDays),
        effectiveFrom: form.effectiveFrom || null,
        effectiveTo: form.effectiveTo || null,
        notes: form.notes || undefined,
      };

      const url = agreement ? `/api/partner-agreements/${agreement.id}` : "/api/partner-agreements";
      const method = agreement ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { notifyError("error.network.promoters.agreement.save_failed", t); return; }
      const json = await res.json();
      const agId = agreement?.id || json.data.id;

      // Save clawback rules
      const validRules = clawbackRules.filter(r => r.windowDays && r.clawbackPercent);
      if (validRules.length > 0) {
        await fetch(`/api/partner-agreements/${agId}/clawback-rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rules: validRules.map(r => ({ windowDays: parseInt(r.windowDays), clawbackPercent: parseFloat(r.clawbackPercent) })) }),
        });
      }

      notifySuccess(
        agreement
          ? "network.promoters.agreement.editor.feedback.updated"
          : "network.promoters.agreement.editor.feedback.created",
        t,
      );
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agreement ? t("network.promoters.agreement.editor.title.edit") : t("network.promoters.agreement.editor.title.new")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t("network.promoters.agreement.editor.description")}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs">{t("network.promoters.agreement.editor.field.name.label")}</Label>
            <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t("network.promoters.agreement.editor.field.name.placeholder")} className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">{t("network.promoters.agreement.editor.field.partner.label")}</Label>
              <Select value={form.d2dPartnerId} onValueChange={val => setForm({ ...form, d2dPartnerId: val ?? "" })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t("network.promoters.agreement.editor.field.partner.placeholder")} /></SelectTrigger>
                <SelectContent>
                  {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("network.promoters.agreement.editor.field.plan.label")}</Label>
              <Select value={form.commissionPlanId} onValueChange={val => setForm({ ...form, commissionPlanId: val ?? "" })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t("network.promoters.agreement.editor.field.plan.placeholder")} /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} v{p.version}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">{t("network.promoters.agreement.editor.field.status.label")}</Label>
              <Select value={form.status} onValueChange={val => setForm({ ...form, status: val ?? "DRAFT" })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">{t("network.promoters.agreement.editor.status.draft")}</SelectItem>
                  <SelectItem value="ACTIVE">{t("network.promoters.agreement.editor.status.active")}</SelectItem>
                  <SelectItem value="SUSPENDED">{t("network.promoters.agreement.editor.status.suspended")}</SelectItem>
                  <SelectItem value="TERMINATED">{t("network.promoters.agreement.editor.status.terminated")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("network.promoters.agreement.editor.field.cadence.label")}</Label>
              <Select value={form.payoutCadence} onValueChange={val => setForm({ ...form, payoutCadence: val ?? "MONTHLY" })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">{t("network.promoters.agreement.editor.cadence.weekly")}</SelectItem>
                  <SelectItem value="BIWEEKLY">{t("network.promoters.agreement.editor.cadence.biweekly")}</SelectItem>
                  <SelectItem value="MONTHLY">{t("network.promoters.agreement.editor.cadence.monthly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("network.promoters.agreement.editor.field.hold.label")}</Label>
              <Input type="number" value={form.holdPeriodDays} onChange={e => setForm({ ...form, holdPeriodDays: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t("network.promoters.agreement.editor.field.effective_from.label")}</Label>
              <Input type="date" value={form.effectiveFrom} onChange={e => setForm({ ...form, effectiveFrom: e.target.value })} className="mt-1" />
            </div>
          </div>

          {/* Clawback Rules */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider">{t("network.promoters.agreement.editor.clawback.title")}</span>
              </div>
              <Button type="button" variant="outline" size="xs" onClick={() => setClawbackRules([...clawbackRules, { windowDays: "", clawbackPercent: "" }])}>
                <Plus className="h-3 w-3 mr-1" />{t("network.promoters.agreement.editor.clawback.add")}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">{t("network.promoters.agreement.editor.clawback.description")}</p>
            {clawbackRules.map((rule, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input type="number" placeholder={t("network.promoters.agreement.editor.clawback.days_placeholder")} value={rule.windowDays} onChange={e => {
                    const updated = [...clawbackRules];
                    updated[idx] = { ...updated[idx], windowDays: e.target.value };
                    setClawbackRules(updated);
                  }} className="h-7 text-xs" />
                </div>
                <span className="text-xs text-muted-foreground">{t("network.promoters.agreement.editor.clawback.days_suffix")}</span>
                <div className="flex-1">
                  <Input type="number" placeholder={t("network.promoters.agreement.editor.clawback.percent_placeholder")} value={rule.clawbackPercent} onChange={e => {
                    const updated = [...clawbackRules];
                    updated[idx] = { ...updated[idx], clawbackPercent: e.target.value };
                    setClawbackRules(updated);
                  }} className="h-7 text-xs" />
                </div>
                <span className="text-xs text-muted-foreground">{t("network.promoters.agreement.editor.clawback.percent_suffix")}</span>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setClawbackRules(clawbackRules.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div>
            <Label className="text-xs">{t("network.promoters.agreement.editor.field.notes.label")}</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.actions.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("network.promoters.agreement.editor.submit.saving") : agreement ? t("network.promoters.agreement.editor.submit.save") : t("network.promoters.agreement.editor.submit.create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
