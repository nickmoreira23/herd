"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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
      if (!res.ok) { toast.error("Failed to save partner"); return; }
      toast.success(partner ? "Partner updated" : "Partner created");
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
          <DialogTitle>{partner ? "Edit D2D Partner" : "New D2D Partner"}</DialogTitle>
          <p className="text-sm text-muted-foreground">External D2D sales company details.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <Label className="text-xs">Company Name</Label>
              <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Apex Door Knockers" className="mt-1" />
            </div>
            <label className="flex items-center gap-2 text-sm h-9 px-3 rounded-lg border bg-muted/30">
              <Switch checked={form.isActive} onCheckedChange={val => setForm({ ...form, isActive: val })} />
              <span className="text-xs font-medium">Active</span>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Contact Name</Label>
              <Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : partner ? "Save Changes" : "Create Partner"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
