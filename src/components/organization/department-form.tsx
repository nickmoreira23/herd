"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

interface DepartmentOption {
  id: string;
  name: string;
  slug: string;
}

interface ProfileOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DepartmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  departments: DepartmentOption[];
  profiles: ProfileOption[];
  editingDepartment?: {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    headId: string | null;
    color: string | null;
  } | null;
  /**
   * Sub-26.4a — quando presente, o create vira VERTICAL: grava no tenant do
   * filho via a rota da 26.3 (`/api/org/[childId]/departments`) e o título do
   * dialog nomeia o filho (clareza de contexto = a confirmação consciente).
   * Opcional → o uso normal (create na própria org) não muda. Edit vertical
   * fora do V1.
   */
  verticalContext?: { childId: string; childName: string };
}

const COLORS = [
  { labelKey: "organization.departments.form.color.indigo", value: "#6366f1" },
  { labelKey: "organization.departments.form.color.green", value: "#10b981" },
  { labelKey: "organization.departments.form.color.pink", value: "#ec4899" },
  { labelKey: "organization.departments.form.color.amber", value: "#f59e0b" },
  { labelKey: "organization.departments.form.color.purple", value: "#8b5cf6" },
  { labelKey: "organization.departments.form.color.cyan", value: "#06b6d4" },
  { labelKey: "organization.departments.form.color.red", value: "#ef4444" },
  { labelKey: "organization.departments.form.color.orange", value: "#f97316" },
] as const satisfies ReadonlyArray<{ labelKey: MessageKey; value: string }>;

export function DepartmentForm({
  open,
  onOpenChange,
  onSaved,
  departments,
  profiles,
  editingDepartment,
  verticalContext,
}: DepartmentFormProps) {
  const t = useT();
  const [name, setName] = useState(editingDepartment?.name ?? "");
  const [description, setDescription] = useState(editingDepartment?.description ?? "");
  const [parentId, setParentId] = useState(editingDepartment?.parentId ?? "");
  const [headId, setHeadId] = useState(editingDepartment?.headId ?? "");
  const [color, setColor] = useState(editingDepartment?.color ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      notifyError("error.organization.name_required", t);
      return;
    }
    setSaving(true);
    try {
      // Vertical create (Sub-26.3 route) when verticalContext is set; otherwise
      // the normal self-org create/edit. Edit stays self-org (vertical edit is
      // out of V1).
      const url = editingDepartment
        ? `/api/departments/${editingDepartment.id}`
        : verticalContext
          ? `/api/org/${verticalContext.childId}/departments`
          : "/api/departments";
      const method = editingDepartment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          parentId: parentId || null,
          headId: headId || null,
          color: color || null,
        }),
      });

      const json = await res.json();
      if (json.error) {
        notifyError(
          verticalContext && res.status === 403
            ? "error.organization.org_vertical_forbidden"
            : "error.organization.save_failed",
          t,
        );
        return;
      }

      notifySuccess(
        editingDepartment
          ? "organization.feedback.department_updated"
          : "organization.feedback.department_created",
        t,
      );
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingDepartment
              ? t("organization.departments.form.edit_title")
              : verticalContext
                ? t("organization.hierarchy.form_create_title", {
                    child: verticalContext.childName,
                  })
                : t("organization.departments.form.create_title")}
          </DialogTitle>
          <DialogDescription>
            {editingDepartment
              ? t("organization.departments.form.edit_description")
              : verticalContext
                ? t("organization.hierarchy.form_create_description", {
                    child: verticalContext.childName,
                  })
                : t("organization.departments.form.create_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("organization.departments.form.name_label")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("organization.departments.form.name_placeholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("organization.departments.form.description_label")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("organization.departments.form.description_placeholder")}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("organization.departments.form.parent_label")}</Label>
              <Select
                value={parentId || "NONE"}
                onValueChange={(val) => setParentId(val === "NONE" ? "" : val ?? "")}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("organization.departments.form.parent_none_placeholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">
                    {t("organization.departments.form.parent_none_option")}
                  </SelectItem>
                  {departments
                    .filter((d) => d.id !== editingDepartment?.id)
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("organization.departments.form.head_label")}</Label>
              <Select
                value={headId || "NONE"}
                onValueChange={(val) => setHeadId(val === "NONE" ? "" : val ?? "")}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("organization.departments.form.head_none_placeholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">
                    {t("organization.departments.form.head_none_option")}
                  </SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("organization.departments.form.color_label")}</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value === color ? "" : c.value)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c.value,
                    borderColor: color === c.value ? "white" : "transparent",
                    boxShadow: color === c.value ? `0 0 0 2px ${c.value}` : "none",
                  }}
                  title={t(c.labelKey)}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? t("organization.departments.form.saving")
              : editingDepartment
                ? t("organization.departments.form.save_changes")
                : t("organization.departments.form.create_department")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
