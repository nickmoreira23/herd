"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import { useViewerPermissions } from "@/lib/permissions/permission-context";
import { toKebab, roleErrorKey, canMutateRoles } from "./roles-manager.helpers";

interface RoleRow {
  id: string;
  name: string;
  key: string;
  description: string | null;
  _count: { membershipRoles: number; rolePermissions: number };
}

export function RolesManager() {
  const t = useT();
  const viewer = useViewerPermissions();
  const canMutate = canMutateRoles(viewer);

  const [roles, setRoles] = useState<RoleRow[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/org/roles");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setRoles(json.data?.roles ?? []);
    } catch {
      setRoles([]);
      notifyError("organization.roles.feedback.load_error", t);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(role: RoleRow) {
    setEditing(role);
    setFormOpen(true);
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t("organization.roles.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("organization.roles.description")}</p>
        </div>
        {canMutate && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("organization.roles.create_button")}
          </Button>
        )}
      </div>

      {roles === null ? (
        <p className="text-sm text-gray-400">{t("organization.roles.loading")}</p>
      ) : roles.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={t("organization.roles.empty_title")}
          description={t("organization.roles.empty_description")}
          action={
            canMutate
              ? { label: t("organization.roles.create_button"), icon: Plus, onClick: openCreate }
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{t("organization.roles.col_name")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("organization.roles.col_permissions")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("organization.roles.col_members")}</th>
                {canMutate && <th className="px-4 py-3 text-right font-medium">{t("organization.roles.col_actions")}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{role.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{role.key}</div>
                    {role.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{role.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {role._count.rolePermissions === 0 ? (
                      <Badge variant="outline" className="text-gray-400">
                        {t("organization.roles.no_permissions")}
                      </Badge>
                    ) : (
                      <span className="text-gray-700">
                        {t("organization.roles.permission_count", { count: role._count.rolePermissions })}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {t("organization.roles.member_count", { count: role._count.membershipRoles })}
                  </td>
                  {canMutate && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">{t("organization.roles.edit_action")}</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(role)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">{t("organization.roles.delete_action")}</span>
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canMutate && (
        <RoleFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          editing={editing}
          onSaved={load}
        />
      )}
      {canMutate && deleteTarget && (
        <DeleteRoleDialog
          role={deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onDeleted={load}
        />
      )}
    </div>
  );
}

function RoleFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: RoleRow | null;
  onSaved: () => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setKey(editing?.key ?? "");
      setKeyTouched(!!editing);
      setDescription(editing?.description ?? "");
      setFieldError(null);
    }
  }, [open, editing]);

  function onNameChange(value: string) {
    setName(value);
    if (!keyTouched) setKey(toKebab(value));
  }

  async function handleSave() {
    setFieldError(null);
    if (!name.trim() || !key.trim()) {
      setFieldError(t("organization.roles.error.invalid"));
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/org/roles/${editing.id}` : "/api/org/roles";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          key: key.trim(),
          description: description.trim() || null,
        }),
      });
      if (res.ok) {
        notifySuccess(
          editing ? "organization.roles.feedback.updated" : "organization.roles.feedback.created",
          t,
        );
        onOpenChange(false);
        onSaved();
        return;
      }
      if (res.status === 422) {
        const json = await res.json().catch(() => null);
        const msg = typeof json?.error === "string" ? json.error : "";
        setFieldError(t(roleErrorKey(msg)));
        return;
      }
      notifyError("organization.roles.feedback.save_error", t);
    } catch {
      notifyError("organization.roles.feedback.save_error", t);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("organization.roles.form.edit_title") : t("organization.roles.form.create_title")}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? t("organization.roles.form.edit_description")
              : t("organization.roles.form.create_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("organization.roles.form.name_label")}</Label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t("organization.roles.form.name_placeholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("organization.roles.form.key_label")}</Label>
            <Input
              value={key}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value);
              }}
              placeholder={t("organization.roles.form.key_placeholder")}
            />
            <p className="text-xs text-gray-400">{t("organization.roles.form.key_hint")}</p>
          </div>
          <div className="space-y-2">
            <Label>{t("organization.roles.form.description_label")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("organization.roles.form.description_placeholder")}
              rows={2}
            />
          </div>
          {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? t("organization.roles.form.saving")
              : editing
                ? t("organization.roles.form.save_edit")
                : t("organization.roles.form.save_create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRoleDialog({
  role,
  onOpenChange,
  onDeleted,
}: {
  role: RoleRow;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const t = useT();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/org/roles/${role.id}`, { method: "DELETE" });
      if (res.ok) {
        notifySuccess("organization.roles.feedback.deleted", t);
        onOpenChange(false);
        onDeleted();
        return;
      }
      notifyError("organization.roles.feedback.delete_error", t);
    } catch {
      notifyError("organization.roles.feedback.delete_error", t);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("organization.roles.delete.title")}</DialogTitle>
          <DialogDescription>
            {t("organization.roles.delete.description", {
              name: role.name,
              count: role._count.membershipRoles,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            {t("organization.roles.delete.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {t("organization.roles.delete.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
