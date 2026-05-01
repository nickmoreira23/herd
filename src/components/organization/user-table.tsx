"use client";

import { useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/shared/data-table";
import { getUserColumns } from "./user-columns";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, SlidersHorizontal, Copy, Check, KeyRound, Eye, EyeOff } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import type { MessageKey } from "@/lib/i18n/t";

// Type for the user data returned from the API with includes
export interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  networkType: "INTERNAL" | "EXTERNAL";
  status: string;
  avatarUrl: string | null;
  lastLogin: string | Date | null;
  createdAt: string | Date;
  profileType: {
    id: string;
    displayName: string;
    slug: string;
    color: string | null;
    networkType: "INTERNAL" | "EXTERNAL";
  };
  profileRoles: Array<{
    role: {
      id: string;
      displayName: string;
      slug: string;
    };
  }>;
  profileRanks?: Array<{
    rankTier: {
      displayName: string;
      color: string | null;
      level: number;
    };
  }>;
}

interface ProfileTypeOption {
  id: string;
  displayName: string;
  slug: string;
  color: string | null;
  networkType: "INTERNAL" | "EXTERNAL";
}

interface RoleOption {
  id: string;
  displayName: string;
  slug: string;
  networkType: "INTERNAL" | "EXTERNAL" | null;
}

interface UserTableProps {
  initialUsers: UserRow[];
  profileTypes: ProfileTypeOption[];
  roles: RoleOption[];
}

const STATUS_OPTIONS = [
  { value: "ALL", labelKey: "organization.users.filter.status_all" },
  { value: "ACTIVE", labelKey: "organization.users.status.active" },
  { value: "PENDING", labelKey: "organization.users.status.pending" },
  { value: "SUSPENDED", labelKey: "organization.users.status.suspended" },
  { value: "TERMINATED", labelKey: "organization.users.status.terminated" },
] as const satisfies ReadonlyArray<{ value: string; labelKey: MessageKey }>;

const NETWORK_OPTIONS = [
  { value: "ALL", labelKey: "organization.users.filter.network_all" },
  { value: "INTERNAL", labelKey: "organization.users.network.internal" },
  { value: "EXTERNAL", labelKey: "organization.users.network.external" },
] as const satisfies ReadonlyArray<{ value: string; labelKey: MessageKey }>;

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  profileTypeId: "",
  roleIds: [] as string[],
  password: "",
};

export function UserTable({ initialUsers, profileTypes, roles }: UserTableProps) {
  const t = useT();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [profileTypeValue, setProfileTypeValue] = useState("ALL");
  const [roleValue, setRoleValue] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Temporary password display after creation
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Password reset state for edit mode
  const [showResetPassword, setShowResetPassword] = useState(false);

  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (networkFilter !== "ALL") {
      filtered = filtered.filter((u) => u.networkType === networkFilter);
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }
    if (profileTypeValue !== "ALL") {
      filtered = filtered.filter((u) => u.profileType.id === profileTypeValue);
    }
    if (roleValue !== "ALL") {
      filtered = filtered.filter((u) =>
        u.profileRoles.some((pr) => pr.role.id === roleValue)
      );
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [users, networkFilter, statusFilter, profileTypeValue, roleValue, search]);

  const refreshUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    const json = await res.json();
    if (json.data) setUsers(json.data);
  }, []);

  const openCreate = useCallback(() => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowResetPassword(false);
    setShowPassword(false);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((user: UserRow) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      profileTypeId: user.profileType.id,
      roleIds: user.profileRoles.map((pr) => pr.role.id),
      password: "",
    });
    setShowResetPassword(false);
    setShowPassword(false);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.firstName || !form.email || !form.profileTypeId) {
      notifyError("error.organization.users.required_fields", t);
      return;
    }
    setSaving(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";

      const payload: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
        profileTypeId: form.profileTypeId,
        roleIds: form.roleIds,
      };

      // Include password for creation or reset
      if (!editingUser && form.password.trim()) {
        payload.password = form.password.trim();
      }
      if (editingUser && showResetPassword && form.password.trim()) {
        payload.password = form.password.trim();
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        notifyError("error.organization.users.save_failed", t);
        return;
      }

      const json = await res.json();

      if (!editingUser && json.data?.temporaryPassword) {
        // Show the temporary password dialog
        setTempPasswordInfo({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          password: json.data.temporaryPassword,
        });
      } else if (editingUser && showResetPassword && form.password.trim()) {
        notifySuccess("organization.users.feedback.password_reset", t);
      } else {
        notifySuccess(
          editingUser
            ? "organization.users.feedback.member_updated"
            : "organization.users.feedback.member_created",
          t
        );
      }

      setModalOpen(false);
      await refreshUsers();
    } finally {
      setSaving(false);
    }
  }, [form, editingUser, showResetPassword, refreshUsers, t]);

  const handleToggleStatus = useCallback(
    async (user: UserRow) => {
      const newStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await refreshUsers();
        notifySuccess(
          newStatus === "ACTIVE"
            ? "organization.users.feedback.member_activated"
            : "organization.users.feedback.member_suspended",
          t
        );
      }
    },
    [refreshUsers, t]
  );

  const handleDelete = useCallback(
    async (user: UserRow) => {
      const confirmMsg = t("organization.users.modal.delete_confirm", {
        name: `${user.firstName} ${user.lastName}`,
      });
      if (!confirm(confirmMsg)) return;
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshUsers();
        notifySuccess("organization.users.feedback.member_deleted", t);
      }
    },
    [refreshUsers, t]
  );

  const columns = useMemo(
    () =>
      getUserColumns({
        onEdit: openEdit,
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
      }),
    [openEdit, handleDelete, handleToggleStatus]
  );

  // Filter roles by the selected profile type's network type
  const selectedProfileType = profileTypes.find((pt) => pt.id === form.profileTypeId);
  const availableRoles = selectedProfileType
    ? roles.filter(
        (r) => !r.networkType || r.networkType === selectedProfileType.networkType
      )
    : roles;

  const handleCopyPassword = useCallback(() => {
    if (!tempPasswordInfo) return;
    navigator.clipboard.writeText(tempPasswordInfo.password);
    setCopied(true);
    notifySuccess("organization.users.feedback.password_copied", t);
    setTimeout(() => setCopied(false), 2000);
  }, [tempPasswordInfo, t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("organization.users.header.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("organization.users.header.description")}
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-3 w-3" />
          {t("organization.users.action.add_member")}
        </Button>
      </div>

      {/* Table */}
      <DataTable
        enableRowSelection
        columns={columns}
        data={filteredUsers}
        countLabel={t("organization.users.count_label")}
        toolbar={() => (
          <div className="flex items-center gap-3">
            <Select
              value={networkFilter}
              onValueChange={(val) => setNetworkFilter(val ?? "ALL")}
            >
              <SelectTrigger className="w-auto min-w-[120px] text-sm shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORK_OPTIONS.map((n) => (
                  <SelectItem key={n.value} value={n.value}>
                    {t(n.labelKey)}
                    {n.value !== "ALL" && (
                      <span className="ml-1.5 text-muted-foreground">
                        ({users.filter((u) => u.networkType === n.value).length})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={profileTypeValue}
              onValueChange={(val) => setProfileTypeValue(val ?? "ALL")}
            >
              <SelectTrigger className="w-auto min-w-[120px] text-sm shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("organization.users.filter.profile_type_all")}
                </SelectItem>
                {profileTypes.map((pt) => (
                  <SelectItem key={pt.id} value={pt.id}>
                    {pt.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={roleValue}
              onValueChange={(val) => setRoleValue(val ?? "ALL")}
            >
              <SelectTrigger className="w-auto min-w-[120px] text-sm shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("organization.users.filter.role_all")}
                </SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val ?? "ALL")}
            >
              <SelectTrigger className="w-auto min-w-[110px] text-sm shrink-0">
                <SlidersHorizontal className="mr-1.5 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {t(s.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t("organization.users.toolbar.search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-20 text-sm w-full"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                {t("organization.users.toolbar.count", { count: filteredUsers.length })}
              </span>
            </div>
          </div>
        )}
      />

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser
                ? t("organization.users.modal.edit_title")
                : t("organization.users.modal.add_title")}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? t("organization.users.modal.edit_description")
                : t("organization.users.modal.add_description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("organization.users.modal.first_name_label")}</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder={t("organization.users.modal.first_name_placeholder")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{t("organization.users.modal.last_name_label")}</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder={t("organization.users.modal.last_name_placeholder")}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>{t("organization.users.modal.email_label")}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder={t("organization.users.modal.email_placeholder")}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("organization.users.modal.phone_label")}</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder={t("organization.users.modal.phone_placeholder")}
                className="mt-1"
              />
            </div>

            {/* Password field — create mode */}
            {!editingUser && (
              <div>
                <Label>
                  {t("organization.users.modal.password_label")}{" "}
                  <span className="text-muted-foreground font-normal">
                    {t("organization.users.modal.password_hint")}
                  </span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={t("organization.users.modal.password_placeholder")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={t(
                      showPassword
                        ? "organization.users.modal.password_hide"
                        : "organization.users.modal.password_show"
                    )}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Password reset — edit mode */}
            {editingUser && (
              <div>
                {!showResetPassword ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResetPassword(true)}
                  >
                    <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                    {t("organization.users.action.reset_password")}
                  </Button>
                ) : (
                  <div>
                    <Label>{t("organization.users.modal.new_password_label")}</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder={t("organization.users.modal.new_password_placeholder")}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={t(
                          showPassword
                            ? "organization.users.modal.password_hide"
                            : "organization.users.modal.password_show"
                        )}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(false);
                        setForm((f) => ({ ...f, password: "" }));
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground mt-1"
                    >
                      {t("organization.users.action.cancel_password_reset")}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>{t("organization.users.modal.profile_type_label")}</Label>
              <Select
                value={form.profileTypeId}
                onValueChange={(val) => {
                  setForm((f) => ({ ...f, profileTypeId: val ?? "", roleIds: [] }));
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue
                    placeholder={t("organization.users.modal.profile_type_placeholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" disabled>
                    {t("organization.users.modal.profile_type_placeholder")}
                  </SelectItem>
                  {/* Internal types */}
                  {profileTypes.filter((pt) => pt.networkType === "INTERNAL").length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {t("organization.users.network.internal")}
                      </div>
                      {profileTypes
                        .filter((pt) => pt.networkType === "INTERNAL")
                        .map((pt) => (
                          <SelectItem key={pt.id} value={pt.id}>
                            {pt.displayName}
                          </SelectItem>
                        ))}
                    </>
                  )}
                  {/* External types */}
                  {profileTypes.filter((pt) => pt.networkType === "EXTERNAL").length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {t("organization.users.network.external")}
                      </div>
                      {profileTypes
                        .filter((pt) => pt.networkType === "EXTERNAL")
                        .map((pt) => (
                          <SelectItem key={pt.id} value={pt.id}>
                            {pt.displayName}
                          </SelectItem>
                        ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            {form.profileTypeId && (
              <div>
                <Label>{t("organization.users.modal.roles_label")}</Label>
                <div className="mt-1 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto rounded-md border p-2">
                  {availableRoles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={form.roleIds.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm((f) => ({ ...f, roleIds: [...f.roleIds, role.id] }));
                          } else {
                            setForm((f) => ({ ...f, roleIds: f.roleIds.filter((id) => id !== role.id) }));
                          }
                        }}
                        className="rounded border-muted-foreground/30"
                      />
                      {role.displayName}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? t("organization.users.action.saving")
                : editingUser
                  ? t("organization.users.action.save_changes")
                  : t("organization.users.action.create_member")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Temporary Password Dialog — shown after user creation */}
      <Dialog
        open={!!tempPasswordInfo}
        onOpenChange={(open) => {
          if (!open) {
            setTempPasswordInfo(null);
            setCopied(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("organization.users.invite.title")}</DialogTitle>
            <DialogDescription>
              {t("organization.users.invite.description", {
                name: tempPasswordInfo?.name ?? "",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("organization.users.invite.email_label")}
              </Label>
              <p className="text-sm font-medium">{tempPasswordInfo?.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("organization.users.invite.temp_password_label")}
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono select-all">
                  {tempPasswordInfo?.password}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyPassword}
                  className="shrink-0"
                  aria-label={t("organization.users.invite.copy_password")}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setTempPasswordInfo(null);
                setCopied(false);
              }}
            >
              {t("organization.users.action.done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
