"use client";

import { useState } from "react";
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
import { Plus, Mail, Trash2 } from "lucide-react";
import { MemberRole } from "@prisma/client";
import { useT } from "@/lib/i18n/locale-context";

interface MemberRow {
  id: string;
  joinedAt: Date | string;
  networkProfile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  roles: Array<{ role: string; scopeType: string }>;
}

interface InvitationRow {
  id: string;
  token: string;
  email: string;
  role: string;
  createdAt: Date | string;
  expiresAt: Date | string | null;
}

interface MembersClientProps {
  members: MemberRow[];
  pendingInvitations: InvitationRow[];
  organizationId: string;
  canManage: boolean;
}

export function MembersClient({
  members: initialMembers,
  pendingInvitations: initialInvitations,
  canManage,
}: MembersClientProps) {
  const t = useT();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>(MemberRole.MEMBER);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitePending, setInvitePending] = useState(false);
  const [revokeLoadingId, setRevokeLoadingId] = useState<string | null>(null);

  async function handleInvite() {
    setInviteError(null);
    setInvitePending(true);
    try {
      const res = await fetch("/api/org/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error ?? t("organization.members.invite_error_fallback"));
        return;
      }
      setInvitations((prev) => [data.data, ...prev]);
      setDialogOpen(false);
      setInviteEmail("");
      setInviteRole(MemberRole.MEMBER);
    } catch {
      setInviteError("Erro de rede. Tente novamente.");
    } finally {
      setInvitePending(false);
    }
  }

  async function handleRevoke(invitationId: string, token: string) {
    setRevokeLoadingId(invitationId);
    try {
      const res = await fetch(`/api/org/invitations/${token}/revoke`, {
        method: "POST",
      });
      if (res.ok) {
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      }
    } finally {
      setRevokeLoadingId(null);
    }
  }

  function formatRole(role: string) {
    return role.charAt(0) + role.slice(1).toLowerCase();
  }

  function formatDate(d: Date | string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t("organization.members.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("organization.members.description")}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("organization.members.invite_button")}
          </Button>
        )}
      </div>

      {/* Active members table */}
      <div>
        <h2 className="text-base font-medium text-gray-900 mb-3">
          {t("organization.members.active_section", { count: initialMembers.length })}
        </h2>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{t("organization.members.col_name")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("organization.members.col_email")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("organization.members.col_role")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("organization.members.col_joined")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    {t("organization.members.empty_active")}
                  </td>
                </tr>
              ) : (
                initialMembers.map((m) => {
                  const orgRole = m.roles.find((r) => r.scopeType === "ORG");
                  return (
                    <tr key={m.id} className="bg-white hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {m.networkProfile.firstName} {m.networkProfile.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {m.networkProfile.email}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {orgRole ? formatRole(orgRole.role) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(m.joinedAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending invitations table */}
      <div>
        <h2 className="text-base font-medium text-gray-900 mb-3">
          {t("organization.members.pending_section", { count: invitations.length })}
        </h2>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{t("organization.members.col_email")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("organization.members.col_role")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("organization.members.col_expires")}</th>
                {canManage && (
                  <th className="px-4 py-3 text-right font-medium">{t("organization.members.col_actions")}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invitations.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 4 : 3}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    {t("organization.members.empty_pending")}
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => (
                  <tr key={inv.id} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                        {inv.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatRole(inv.role)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(inv.expiresAt)}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={revokeLoadingId === inv.id}
                          onClick={() => handleRevoke(inv.id, inv.token)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Revogar</span>
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("organization.members.invite_dialog_title")}</DialogTitle>
            <DialogDescription>
              {t("organization.members.invite_dialog_description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {inviteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {inviteError}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="invite-email">{t("organization.members.invite_field_email")}</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder={t("organization.members.invite_field_email_placeholder")}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invite-role">{t("organization.members.invite_field_role")}</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as MemberRole)}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MemberRole.MEMBER}>{t("organization.members.role_member")}</SelectItem>
                  <SelectItem value={MemberRole.ADMIN}>{t("organization.members.role_admin")}</SelectItem>
                  <SelectItem value={MemberRole.OWNER}>{t("organization.members.role_owner")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setInviteError(null);
              }}
            >
              {t("organization.members.cancel")}
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail || invitePending}
            >
              {invitePending ? t("organization.members.sending") : t("organization.members.send_invite")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
