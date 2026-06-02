"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import type { MessageKey } from "@/lib/i18n/t";

interface PermissionsMatrixProps {
  resources: string[];
  actions: string[];
  roles: string[];
  /** Roles defined in the model but not yet used as access gates. */
  departmentRoles: string[];
  /** Resources declared in the model with no route to enforce against yet. */
  ghostResources: string[];
  /** Roles whose grants are editable (ORG roles); others stay read-only. */
  editableRoles: string[];
  /** True when the viewer (super_admin) may edit grants. */
  canEdit: boolean;
  /** role → ["resource:action", ...] grant keys (serialized server-side). */
  grants: Record<string, string[]>;
}

export function PermissionsMatrix({
  resources,
  actions,
  roles,
  departmentRoles,
  ghostResources,
  editableRoles,
  canEdit,
  grants,
}: PermissionsMatrixProps) {
  const t = useT();
  const router = useRouter();
  const inertRoles = new Set(departmentRoles);
  const ghostSet = new Set(ghostResources);
  const editableRoleSet = new Set(editableRoles);
  const [loadingCell, setLoadingCell] = useState<string | null>(null);

  // A cell is editable iff the viewer can edit, the role is ORG-scoped, and the
  // resource has a route (non-ghost). Ghost resources + department roles stay
  // read-only — the editor never claims power over what does not enforce.
  const isEditable = (role: string, resource: string) =>
    canEdit && editableRoleSet.has(role) && !ghostSet.has(resource);

  async function handleToggle(
    role: string,
    resource: string,
    action: string,
    currentlyGranted: boolean
  ) {
    const cellKey = `${role}:${resource}:${action}`;
    setLoadingCell(cellKey);
    try {
      const res = await fetch("/api/org/permissions/grant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          resource,
          action,
          scopeType: "ORG",
          granted: !currentlyGranted,
        }),
      });
      if (res.ok) {
        notifySuccess("organization.permissions.grant_updated", t);
        router.refresh(); // re-fetch DB-backed matrix (no optimistic UI)
      } else if (res.status === 403) {
        notifyError("organization.permissions.grant_forbidden", t);
      } else if (res.status === 422) {
        notifyError("organization.permissions.grant_locked", t);
      } else {
        notifyError("organization.permissions.grant_update_error", t);
      }
    } catch {
      notifyError("organization.permissions.grant_update_error", t);
    } finally {
      setLoadingCell(null);
    }
  }

  // Dynamic i18n keys — every value is enumerated in the dictionaries; the cast
  // mirrors the sub-panel registry pattern (labelKey kept loose, cast at lookup).
  const roleLabel = (role: string) =>
    t(`organization.permissions.role.${role}` as MessageKey);
  const resourceLabel = (resource: string) =>
    t(`organization.permissions.resource.${resource}` as MessageKey);
  const actionLabel = (action: string) =>
    t(`organization.permissions.action.${action}` as MessageKey);
  const isGranted = (role: string, resource: string, action: string) =>
    grants[role]?.includes(`${resource}:${action}`) ?? false;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("organization.permissions.title")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("organization.permissions.subtitle")}
        </p>
      </div>

      <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>{t("organization.permissions.honest_banner")}</p>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                {t("organization.permissions.resource_header")}
              </th>
              <th className="px-4 py-3 text-left font-medium">
                {t("organization.permissions.action_header")}
              </th>
              {roles.map((role) => {
                const inert = inertRoles.has(role);
                return (
                  <th
                    key={role}
                    className={`px-4 py-3 text-center font-medium ${
                      inert ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="normal-case">{roleLabel(role)}</span>
                      {inert && (
                        <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-normal normal-case text-gray-400">
                          {t("organization.permissions.inert_badge")}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resources.map((resource) =>
              actions.map((action, actionIndex) => (
                <tr
                  key={`${resource}:${action}`}
                  className="bg-white hover:bg-gray-50"
                >
                  {actionIndex === 0 && (
                    <td
                      rowSpan={actions.length}
                      className="px-4 py-3 align-top border-r border-gray-100"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900">
                          {resourceLabel(resource)}
                        </span>
                        {ghostSet.has(resource) && (
                          <span className="self-start rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-normal text-slate-500">
                            {t("organization.permissions.ghost_badge")}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-2 text-gray-500">
                    {actionLabel(action)}
                  </td>
                  {roles.map((role) => {
                    const granted = isGranted(role, resource, action);
                    const inert = inertRoles.has(role);
                    const editable = isEditable(role, resource);
                    const cellKey = `${role}:${resource}:${action}`;
                    return (
                      <td key={role} className="px-4 py-2 text-center">
                        {editable ? (
                          <Switch
                            checked={granted}
                            disabled={loadingCell === cellKey}
                            onCheckedChange={() =>
                              handleToggle(role, resource, action, granted)
                            }
                          />
                        ) : granted ? (
                          <Check
                            className={`inline h-4 w-4 ${
                              inert ? "text-gray-300" : "text-green-600"
                            }`}
                          />
                        ) : (
                          <span className="text-gray-200">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-gray-400">
          {t("organization.permissions.inert_legend")}
        </p>
        <p className="text-xs text-gray-400">
          {t("organization.permissions.ghost_legend")}
        </p>
      </div>
    </div>
  );
}
