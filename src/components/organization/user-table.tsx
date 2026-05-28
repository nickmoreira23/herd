"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/data-table";
import { getUserColumns } from "./user-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search } from "lucide-react";
import { MemberRole } from "@prisma/client";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

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

interface UserTableProps {
  initialUsers: UserRow[];
}

export function UserTable({ initialUsers }: UserTableProps) {
  const t = useT();
  const [users] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState("");

  // Invite form state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>(MemberRole.MEMBER);
  const [invitePending, setInvitePending] = useState(false);

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      notifyError("error.organization.users.required_fields", t);
      return;
    }
    setInvitePending(true);
    try {
      const res = await fetch("/api/org/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (!res.ok) {
        if (res.status === 409) {
          notifyError("error.organization.users.invitation_already_exists", t);
        } else {
          notifyError("error.organization.users.save_failed", t);
        }
        return;
      }
      const email = inviteEmail.trim();
      notifySuccess("organization.users.feedback.invitation_sent", t, { email });
      setInviteEmail("");
      setInviteRole(MemberRole.MEMBER);
      setInviteDialogOpen(false);
    } finally {
      setInvitePending(false);
    }
  };

  // Columns are read-only for now (no edit/delete until Sub-etapa 27 activates this component)
  const columns = getUserColumns({
    onEdit: () => {},
    onDelete: async () => {},
    onToggleStatus: async () => {},
  });

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
        <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
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

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("organization.users.modal.invite_title")}</DialogTitle>
            <DialogDescription>
              {t("organization.users.modal.invite_description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {t("organization.users.modal.email_label")}
              </label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t("organization.users.modal.email_placeholder")}
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleInvite();
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {t("organization.users.modal.role_label")}
              </label>
              <Select
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val as MemberRole)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MemberRole.MEMBER}>
                    {t("organization.users.role.member")}
                  </SelectItem>
                  <SelectItem value={MemberRole.ADMIN}>
                    {t("organization.users.role.admin")}
                  </SelectItem>
                  <SelectItem value={MemberRole.OWNER}>
                    {t("organization.users.role.owner")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => void handleInvite()} disabled={invitePending}>
              {invitePending
                ? t("organization.users.action.saving")
                : t("organization.users.action.send_invite")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
