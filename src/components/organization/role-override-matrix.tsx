"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, Info } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import type { MessageKey } from "@/lib/i18n/t";

type Effect = "grant" | "deny" | "inherit";
interface CustomRole {
  id: string;
  name: string;
}
interface Props {
  resources: string[];
  actions: string[];
  systemRoles: string[]; // OWNER / ADMIN / MEMBER
  customRoles: CustomRole[];
  resolved: Record<string, string[]>; // roleKey -> ["resource:action"] (final, deny applied)
  overrides: Record<string, string>; // "roleKey:resource:action" -> "grant"|"deny"
  floor: string[]; // ["resource:action"] of the OWNER floor
  canEdit: boolean; // viewer is OWNER
}

export function RoleOverrideMatrix({
  resources, actions, systemRoles, customRoles, resolved, overrides, floor, canEdit,
}: Props) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const floorSet = new Set(floor);

  const label = (kind: "resource" | "action", v: string) =>
    t(`organization.permissions.${kind}.${v}` as MessageKey);

  async function setOverride(
    target: { role?: string; roleId?: string }, resource: string, action: string, effect: Effect, cellKey: string
  ) {
    setLoading(cellKey);
    try {
      const res = await fetch("/api/org/roles/matrix", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...target, resource, action, effect }),
      });
      if (res.ok) {
        notifySuccess("organization.role_overrides.saved", t);
        router.refresh();
      } else if (res.status === 422) {
        notifyError("organization.role_overrides.floor_locked", t);
      } else if (res.status === 403) {
        notifyError("organization.role_overrides.forbidden", t);
      } else {
        notifyError("organization.role_overrides.error", t);
      }
    } catch {
      notifyError("organization.role_overrides.error", t);
    } finally {
      setLoading(null);
    }
  }

  function Cell({ roleKey, target, resource, action }: {
    roleKey: string; target: { role?: string; roleId?: string }; resource: string; action: string;
  }) {
    const ra = `${resource}:${action}`;
    const cellKey = `${roleKey}:${ra}`;
    const override = overrides[cellKey] as Effect | undefined;
    const granted = resolved[roleKey]?.includes(ra) ?? false;
    const locked = roleKey === "OWNER" && floorSet.has(ra);

    if (locked) {
      return (
        <td className="px-3 py-2 text-center" title={t("organization.role_overrides.floor_tooltip")}>
          <Lock className="inline h-4 w-4 text-amber-500" />
        </td>
      );
    }
    if (!canEdit) {
      // ADMIN read-only: show resolved state + override badge.
      return (
        <td className="px-3 py-2 text-center">
          {granted ? <Check className="inline h-4 w-4 text-green-600" /> : <span className="text-gray-200">—</span>}
          {override && (
            <span className={`ml-1 text-[10px] ${override === "deny" ? "text-red-500" : "text-blue-500"}`}>
              {override === "deny" ? t("organization.role_overrides.badge_deny") : t("organization.role_overrides.badge_grant")}
            </span>
          )}
        </td>
      );
    }
    const current: Effect = override ?? "inherit";
    return (
      <td className="px-3 py-2 text-center">
        <select
          className={`rounded border px-1 py-0.5 text-xs ${
            current === "deny" ? "border-red-300 text-red-600" : current === "grant" ? "border-blue-300 text-blue-600" : "border-gray-200 text-gray-500"
          }`}
          disabled={loading === cellKey}
          value={current}
          onChange={(e) => setOverride(target, resource, action, e.target.value as Effect, cellKey)}
        >
          <option value="inherit">{t("organization.role_overrides.effect_inherit")}{granted ? " ✓" : ""}</option>
          <option value="grant">{t("organization.role_overrides.effect_grant")}</option>
          <option value="deny">{t("organization.role_overrides.effect_deny")}</option>
        </select>
      </td>
    );
  }

  const Grid = ({ columns }: { columns: { key: string; label: string; target: { role?: string; roleId?: string } }[] }) => (
    <div className="rounded-lg border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th className="px-3 py-3 text-left font-medium">{t("organization.permissions.resource_header")}</th>
            <th className="px-3 py-3 text-left font-medium">{t("organization.permissions.action_header")}</th>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-3 text-center font-medium normal-case">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {resources.flatMap((resource) =>
            actions.map((action, i) => (
              <tr key={`${resource}:${action}`} className="bg-white hover:bg-gray-50">
                {i === 0 && (
                  <td rowSpan={actions.length} className="px-3 py-3 align-top border-r border-gray-100 font-medium text-gray-900">
                    {label("resource", resource)}
                  </td>
                )}
                <td className="px-3 py-2 text-gray-500">{label("action", action)}</td>
                {columns.map((c) => (
                  <Cell key={c.key} roleKey={c.key} target={c.target} resource={resource} action={action} />
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    // 16px (gap-4) separation between the two containers.
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t("organization.role_overrides.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("organization.role_overrides.subtitle")}</p>
      </div>

      {!canEdit && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{t("organization.role_overrides.read_only")}</p>
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">{t("organization.role_overrides.system_roles")}</h2>
        <Grid columns={systemRoles.map((r) => ({ key: r, label: t(`organization.permissions.role.${r}` as MessageKey), target: { role: r } }))} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">{t("organization.role_overrides.custom_roles")}</h2>
        {customRoles.length === 0 ? (
          <p className="text-sm text-gray-400">{t("organization.role_overrides.no_custom_roles")}</p>
        ) : (
          <Grid columns={customRoles.map((r) => ({ key: r.id, label: r.name, target: { roleId: r.id } }))} />
        )}
      </section>
    </div>
  );
}
