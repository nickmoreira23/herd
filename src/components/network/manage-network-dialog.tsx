"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Globe,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DEFAULT_CATEGORY_COLOR } from "@/lib/blocks/block-categories";

// ─── Types ─────────────────────────────────────────────────────

type Page = "profiles" | "roles";

interface ProfileTypeRow {
  id: string;
  slug: string;
  displayName: string;
  networkType: "INTERNAL" | "EXTERNAL";
  color: string | null;
  isActive: boolean;
  canDelete: boolean;
}

interface RoleRow {
  id: string;
  slug: string;
  displayName: string;
  networkType: "INTERNAL" | "EXTERNAL" | null;
  isSystem: boolean;
  _count?: { profileRoles: number };
}

interface ManageNetworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: () => void;
}

const PAGES: { key: Page; label: string; icon: LucideIcon }[] = [
  { key: "profiles", label: "Profiles", icon: Layers },
  { key: "roles", label: "Roles", icon: Shield },
];

// ─── Component ─────────────────────────────────────────────────

export function ManageNetworkDialog({
  open,
  onOpenChange,
  onChange,
}: ManageNetworkDialogProps) {
  const [activePage, setActivePage] = useState<Page>("profiles");
  const [profileTypes, setProfileTypes] = useState<ProfileTypeRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActivePage("profiles");
    setLoading(true);
    Promise.all([
      fetch("/api/network/profile-types").then((r) => r.json()),
      fetch("/api/network/roles").then((r) => r.json()),
    ])
      .then(([ptJson, rJson]) => {
        if (Array.isArray(ptJson.data)) setProfileTypes(ptJson.data);
        if (Array.isArray(rJson.data)) setRoles(rJson.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  async function handleDeleteProfileType(id: string, name: string) {
    if (!confirm(`Delete profile type "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/network/profile-types/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.error) {
      toast.error(json.error);
      return;
    }
    setProfileTypes((prev) => prev.filter((p) => p.id !== id));
    onChange();
    window.dispatchEvent(new CustomEvent("network-sidebar-updated"));
  }

  async function handleDeleteRole(id: string, name: string) {
    if (!confirm(`Delete role "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/network/roles/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.error) {
      toast.error(json.error);
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== id));
  }

  const internalProfileTypes = profileTypes.filter(
    (p) => p.networkType === "INTERNAL",
  );
  const externalProfileTypes = profileTypes.filter(
    (p) => p.networkType === "EXTERNAL",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle>Manage</DialogTitle>
          <DialogDescription>
            Profile Types and Roles.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[420px] max-h-[65vh]">
          {/* Left sidebar */}
          <nav className="w-[160px] shrink-0 border-r bg-muted/30 p-3 space-y-0.5">
            {PAGES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActivePage(key)}
                className={cn(
                  "flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
                  activePage === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activePage === "profiles" && (
              <ProfileTypesContent
                loading={loading}
                internal={internalProfileTypes}
                external={externalProfileTypes}
                onDelete={handleDeleteProfileType}
              />
            )}
            {activePage === "roles" && (
              <RolesContent
                loading={loading}
                roles={roles}
                onDelete={handleDeleteRole}
              />
            )}
          </div>
        </div>

        <DialogFooter className="rounded-b-xl">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Profile Types Content ─────────────────────────────────────

function ProfileTypesContent({
  loading,
  internal,
  external,
  onDelete,
}: {
  loading: boolean;
  internal: ProfileTypeRow[];
  external: ProfileTypeRow[];
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Profile types define the kind of member (internal role or external channel).
        </p>
        <Link
          href="/admin/network/profile-types/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          New
        </Link>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground italic">Loading…</p>
      ) : (
        <>
          <ProfileTypeGroup
            title="Internal Network"
            icon={Building2}
            rows={internal}
            onDelete={onDelete}
          />
          <ProfileTypeGroup
            title="External Network"
            icon={Globe}
            rows={external}
            onDelete={onDelete}
          />
        </>
      )}
    </div>
  );
}

function ProfileTypeGroup({
  title,
  icon: Icon,
  rows,
  onDelete,
}: {
  title: string;
  icon: LucideIcon;
  rows: ProfileTypeRow[];
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground italic px-1">
          None yet.
        </p>
      ) : (
        <div className="space-y-1">
          {rows.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5"
            >
              <span
                className="inline-block size-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: p.color || DEFAULT_CATEGORY_COLOR,
                }}
              />
              <span className="flex-1 truncate text-sm">{p.displayName}</span>
              <span className="text-[10px] text-muted-foreground">
                {p.slug}
              </span>
              <Link
                href={`/admin/network/profile-types/${p.id}`}
                className="inline-flex items-center justify-center size-6 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Edit"
              >
                <Pencil className="size-3.5" />
              </Link>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete(p.id, p.displayName)}
                disabled={!p.canDelete}
                title={p.canDelete ? "Delete" : "Cannot delete (in use)"}
                aria-label="Delete"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Roles Content ─────────────────────────────────────────────

function RolesContent({
  loading,
  roles,
  onDelete,
}: {
  loading: boolean;
  roles: RoleRow[];
  onDelete: (id: string, name: string) => void;
}) {
  const general = roles.filter((r) => !r.networkType);
  const internal = roles.filter((r) => r.networkType === "INTERNAL");
  const external = roles.filter((r) => r.networkType === "EXTERNAL");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Roles control what members can do across the network.
        </p>
        <Link
          href="/admin/network/roles/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          New
        </Link>
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground italic">Loading…</p>
      ) : (
        <>
          <RoleGroup
            title="General"
            icon={Shield}
            rows={general}
            onDelete={onDelete}
          />
          <RoleGroup
            title="Internal Network"
            icon={Building2}
            rows={internal}
            onDelete={onDelete}
          />
          <RoleGroup
            title="External Network"
            icon={Globe}
            rows={external}
            onDelete={onDelete}
          />
        </>
      )}
    </div>
  );
}

function RoleGroup({
  title,
  icon: Icon,
  rows,
  onDelete,
}: {
  title: string;
  icon: LucideIcon;
  rows: RoleRow[];
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground italic px-1">None yet.</p>
      ) : (
        <div className="space-y-1">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5"
            >
              {r.isSystem && (
                <Lock className="size-3 text-muted-foreground shrink-0" />
              )}
              <span className="flex-1 truncate text-sm">{r.displayName}</span>
              <span className="text-[10px] text-muted-foreground">{r.slug}</span>
              <Link
                href={`/admin/network/roles/${r.id}`}
                className="inline-flex items-center justify-center size-6 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Edit"
              >
                <Pencil className="size-3.5" />
              </Link>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete(r.id, r.displayName)}
                disabled={r.isSystem}
                title={r.isSystem ? "System role" : "Delete"}
                aria-label="Delete"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
