"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { formatDate } from "@/lib/i18n/format-date";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import type { UserRow } from "./user-table";

interface ColumnActions {
  onEdit: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "border-green-500/50 bg-green-500/10 text-green-500",
  PENDING: "border-yellow-400/50 bg-yellow-400/10 text-yellow-400",
  SUSPENDED: "border-orange-400/50 bg-orange-400/10 text-orange-400",
  TERMINATED: "border-red-400/50 bg-red-400/10 text-red-400",
};

const STATUS_LABEL_KEYS = {
  ACTIVE: "organization.users.status.active",
  PENDING: "organization.users.status.pending",
  SUSPENDED: "organization.users.status.suspended",
  TERMINATED: "organization.users.status.terminated",
} as const satisfies Record<string, MessageKey>;

const NETWORK_LABEL_KEYS = {
  INTERNAL: "organization.users.network.internal",
  EXTERNAL: "organization.users.network.external",
} as const satisfies Record<string, MessageKey>;

// --- Header components -----------------------------------------------------

function SortHeader({
  labelKey,
  onClick,
}: {
  labelKey: MessageKey;
  onClick: () => void;
}) {
  const t = useT();
  return (
    <button
      className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
      onClick={onClick}
    >
      {t(labelKey)}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}

function PlainHeader({ labelKey }: { labelKey: MessageKey }) {
  const t = useT();
  return <span className="text-xs">{t(labelKey)}</span>;
}

function SelectAllCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  const t = useT();
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="rounded border-muted-foreground/30"
      aria-label={t("organization.users.column.select_all")}
    />
  );
}

function SelectRowCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  const t = useT();
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="rounded border-muted-foreground/30"
      aria-label={t("organization.users.column.select_row")}
    />
  );
}

// --- Cell components -------------------------------------------------------

function NameCell({ user, onEdit }: { user: UserRow; onEdit: (u: UserRow) => void }) {
  return (
    <button
      className="flex flex-col text-left hover:underline"
      onClick={() => onEdit(user)}
    >
      <span className="text-sm font-medium">
        {user.firstName} {user.lastName}
      </span>
      <span className="text-xs text-muted-foreground">{user.email}</span>
    </button>
  );
}

function NetworkCell({ networkType }: { networkType: string }) {
  const t = useT();
  const key = NETWORK_LABEL_KEYS[networkType as keyof typeof NETWORK_LABEL_KEYS];
  return (
    <Badge variant="outline" className="text-xs font-normal px-1 py-1">
      {key ? t(key) : networkType}
    </Badge>
  );
}

function ProfileTypeCell({ displayName }: { displayName: string }) {
  return (
    <Badge variant="outline" className="text-xs font-normal px-1 py-1">
      {displayName}
    </Badge>
  );
}

function RolesCell({ user }: { user: UserRow }) {
  const roles = user.profileRoles;
  if (!roles.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {roles.slice(0, 2).map((pr) => (
        <Badge key={pr.role.id} variant="outline" className="text-xs font-normal px-1 py-1">
          {pr.role.displayName}
        </Badge>
      ))}
      {roles.length > 2 && (
        <span className="text-xs text-muted-foreground">+{roles.length - 2}</span>
      )}
    </div>
  );
}

function StatusCell({ status }: { status: string }) {
  const t = useT();
  const key = STATUS_LABEL_KEYS[status as keyof typeof STATUS_LABEL_KEYS];
  return (
    <Badge
      variant="outline"
      className={`text-xs font-normal px-1 py-1 ${STATUS_COLORS[status] || ""}`}
    >
      {key ? t(key) : status}
    </Badge>
  );
}

function LastLoginCell({ date }: { date: Date | string | null }) {
  const t = useT();
  const locale = useLocale();
  if (!date)
    return (
      <span className="text-sm text-muted-foreground">
        {t("organization.users.column.never")}
      </span>
    );
  return (
    <span className="text-sm text-muted-foreground">
      {formatDate(new Date(date), locale, "short")}
    </span>
  );
}

function CreatedAtCell({ date }: { date: Date | string }) {
  const locale = useLocale();
  return (
    <span className="text-sm text-muted-foreground">
      {formatDate(new Date(date), locale, "short")}
    </span>
  );
}

function ActionsCell({
  user,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  user: UserRow;
  onEdit: (u: UserRow) => void;
  onDelete: (u: UserRow) => void;
  onToggleStatus: (u: UserRow) => void;
}) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(user)}>
          {t("common.actions.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleStatus(user)}>
          {user.status === "SUSPENDED"
            ? t("organization.users.action.activate")
            : t("organization.users.action.suspend")}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(user)}>
          {t("common.actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Column factory --------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getUserColumns(actions: ColumnActions): ColumnDef<UserRow, any>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <SelectAllCheckbox
          checked={table.getIsAllPageRowsSelected()}
          onChange={(val) => table.toggleAllPageRowsSelected(val)}
        />
      ),
      cell: ({ row }) => (
        <SelectRowCheckbox
          checked={row.getIsSelected()}
          onChange={(val) => row.toggleSelected(val)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <SortHeader
          labelKey="organization.users.column.name"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => <NameCell user={row.original} onEdit={actions.onEdit} />,
    },
    {
      accessorKey: "networkType",
      header: () => <PlainHeader labelKey="organization.users.column.network" />,
      cell: ({ row }) => <NetworkCell networkType={row.original.networkType} />,
    },
    {
      accessorKey: "profileType",
      header: () => <PlainHeader labelKey="organization.users.column.profile_type" />,
      cell: ({ row }) => (
        <ProfileTypeCell displayName={row.original.profileType.displayName} />
      ),
    },
    {
      id: "roles",
      header: () => <PlainHeader labelKey="organization.users.column.roles" />,
      cell: ({ row }) => <RolesCell user={row.original} />,
    },
    {
      accessorKey: "status",
      header: () => <PlainHeader labelKey="organization.users.column.status" />,
      cell: ({ row }) => <StatusCell status={row.original.status} />,
    },
    {
      accessorKey: "lastLogin",
      header: ({ column }) => (
        <SortHeader
          labelKey="organization.users.column.last_login"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => <LastLoginCell date={row.original.lastLogin} />,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortHeader
          labelKey="organization.users.column.created"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => <CreatedAtCell date={row.original.createdAt} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ActionsCell
          user={row.original}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
          onToggleStatus={actions.onToggleStatus}
        />
      ),
    },
  ];
}
