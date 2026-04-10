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
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

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
  { value: "All Statuses", filterKey: "ALL" },
  { value: "Active", filterKey: "ACTIVE" },
  { value: "Pending", filterKey: "PENDING" },
  { value: "Suspended", filterKey: "SUSPENDED" },
  { value: "Terminated", filterKey: "TERMINATED" },
] as const;

const NETWORK_OPTIONS = [
  { value: "All Networks", filterKey: "ALL" },
  { value: "Internal", filterKey: "INTERNAL" },
  { value: "External", filterKey: "EXTERNAL" },
] as const;

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  profileTypeId: "",
  roleIds: [] as string[],
};

export function UserTable({ initialUsers, profileTypes, roles }: UserTableProps) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [networkValue, setNetworkValue] = useState("All Networks");
  const [statusValue, setStatusValue] = useState("All Statuses");
  const [profileTypeValue, setProfileTypeValue] = useState("All Types");
  const [roleValue, setRoleValue] = useState("All Roles");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const networkFilter = NETWORK_OPTIONS.find((n) => n.value === networkValue)?.filterKey ?? "ALL";
  const statusFilter = STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (networkFilter !== "ALL") {
      filtered = filtered.filter((u) => u.networkType === networkFilter);
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }
    if (profileTypeValue !== "All Types") {
      filtered = filtered.filter((u) => u.profileType.id === profileTypeValue);
    }
    if (roleValue !== "All Roles") {
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
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.firstName || !form.email || !form.profileTypeId) {
      toast.error("First name, email, and profile type are required");
      return;
    }
    setSaving(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          profileTypeId: form.profileTypeId,
          roleIds: form.roleIds,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      toast.success(editingUser ? "User updated" : "User created");
      setModalOpen(false);
      await refreshUsers();
    } finally {
      setSaving(false);
    }
  }, [form, editingUser, refreshUsers]);

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
        toast.success(newStatus === "ACTIVE" ? "User activated" : "User suspended");
      }
    },
    [refreshUsers]
  );

  const handleDelete = useCallback(
    async (user: UserRow) => {
      if (!confirm(`Delete "${user.firstName} ${user.lastName}"? This cannot be undone.`)) return;
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshUsers();
        toast.success("User deleted");
      }
    },
    [refreshUsers]
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all users across your network — internal team members and external partners.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-3 w-3" />
          Add User
        </Button>
      </div>

      {/* Table */}
      <DataTable
        enableRowSelection
        columns={columns}
        data={filteredUsers}
        countLabel="user"
        toolbar={() => (
          <div className="flex items-center gap-3">
            <Select
              value={networkValue}
              onValueChange={(val) => setNetworkValue(val ?? "All Networks")}
            >
              <SelectTrigger className="w-auto min-w-[120px] text-sm shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORK_OPTIONS.map((n) => (
                  <SelectItem key={n.value} value={n.value}>
                    {n.value}
                    {n.filterKey !== "ALL" && (
                      <span className="ml-1.5 text-muted-foreground">
                        ({users.filter((u) => u.networkType === n.filterKey).length})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={profileTypeValue}
              onValueChange={(val) => setProfileTypeValue(val ?? "All Types")}
            >
              <SelectTrigger className="w-auto min-w-[120px] text-sm shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Types">All Types</SelectItem>
                {profileTypes.map((pt) => (
                  <SelectItem key={pt.id} value={pt.id}>
                    {pt.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={roleValue}
              onValueChange={(val) => setRoleValue(val ?? "All Roles")}
            >
              <SelectTrigger className="w-auto min-w-[120px] text-sm shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Roles">All Roles</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusValue}
              onValueChange={(val) => setStatusValue(val ?? "All Statuses")}
            >
              <SelectTrigger className="w-auto min-w-[110px] text-sm shrink-0">
                <SlidersHorizontal className="mr-1.5 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-20 text-sm w-full"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                {filteredUsers.length} users
              </span>
            </div>
          </div>
        )}
      />

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update this user's details, profile type, and roles."
                : "Add a new user to the network."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="First name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Last name"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@company.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Profile Type</Label>
              <Select
                value={form.profileTypeId}
                onValueChange={(val) => {
                  setForm((f) => ({ ...f, profileTypeId: val ?? "", roleIds: [] }));
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a profile type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" disabled>
                    Select a profile type...
                  </SelectItem>
                  {/* Internal types */}
                  {profileTypes.filter((pt) => pt.networkType === "INTERNAL").length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Internal</div>
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
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">External</div>
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
                <Label>Roles</Label>
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
                ? "Saving..."
                : editingUser
                  ? "Save Changes"
                  : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
