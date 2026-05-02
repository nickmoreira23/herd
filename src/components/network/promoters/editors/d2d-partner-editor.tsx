"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

interface PartnerData {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  notes: string | null;
}

interface D2DPartnerEditorProps {
  partner?: PartnerData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function D2DPartnerEditor({ partner, open, onOpenChange, onSaved }: D2DPartnerEditorProps) {
  const t = useT();
  const [form, setForm] = useState({ name: "", contactName: "", contactEmail: "", contactPhone: "", isActive: true, notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name,
        contactName: partner.contactName || "",
        contactEmail: partner.contactEmail || "",
        contactPhone: partner.contactPhone || "",
        isActive: partner.isActive,
        notes: partner.notes || "",
      });
    } else {
      setForm({ name: "", contactName: "", contactEmail: "", contactPhone: "", isActive: true, notes: "" });
    }
  }, [partner, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = partner ? `/api/d2d-partners/${partner.id}` : "/api/d2d-partners";
      const method = partner ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { notifyError("error.network.promoters.d2d_partner.save_failed", t); return; }
      notifySuccess(
        partner
          ? "network.promoters.d2d_partner.editor.feedback.updated"
          : "network.promoters.d2d_partner.editor.feedback.created",
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{partner ? t("network.promoters.d2d_partner.editor.title.edit") : t("network.promoters.d2d_partner.editor.title.new")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t("network.promoters.d2d_partner.editor.description")}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <Label className="text-xs">{t("network.promoters.d2d_partner.editor.field.name.label")}</Label>
              <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t("network.promoters.d2d_partner.editor.field.name.placeholder")} className="mt-1" />
            </div>
            <label className="flex items-center gap-2 text-sm h-9 px-3 rounded-lg border bg-muted/30">
              <Switch checked={form.isActive} onCheckedChange={val => setForm({ ...form, isActive: val })} />
              <span className="text-xs font-medium">{t("network.promoters.d2d_partner.editor.field.active.label")}</span>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">{t("network.promoters.d2d_partner.editor.field.contact_name.label")}</Label>
              <Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t("network.promoters.d2d_partner.editor.field.email.label")}</Label>
              <Input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t("network.promoters.d2d_partner.editor.field.phone.label")}</Label>
              <Input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">{t("network.promoters.d2d_partner.editor.field.notes.label")}</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.actions.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("network.promoters.d2d_partner.editor.submit.saving") : partner ? t("network.promoters.d2d_partner.editor.submit.save") : t("network.promoters.d2d_partner.editor.submit.create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
