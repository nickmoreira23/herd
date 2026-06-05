"use client";

import { createContext, useContext, useMemo } from "react";
import { buildKey, type KeyScopeType } from "./permission-key";
import type { ActionType, ResourceType } from "./types";
import type { ViewerPermissions } from "./resolve-viewer-permissions";

/**
 * R&P Fase 7a — client permission plumbing. The provider is SEEDED from the server
 * (resolveViewerPermissions) in the org layout, so the allow-set is present at first
 * paint (no fetch, no flicker). `can()` is a PURE lookup over that set — it does NOT
 * re-implement precedence/deny/floor (those were collapsed server-side by the loader).
 *
 * INERT in 7a: this provider mounts and holds the data, but no nav/screen consumes
 * `useCan` yet (that is 7b). `orgRole` (enum) is carried for governance gating (D13).
 */
type Scope = { type: KeyScopeType; id?: string | null };

interface PermissionContextValue extends ViewerPermissions {
  allow: Set<string>;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({
  value,
  children,
}: {
  value: ViewerPermissions;
  children: React.ReactNode;
}) {
  const ctx = useMemo<PermissionContextValue>(
    () => ({ ...value, allow: new Set(value.allowSet) }),
    [value]
  );
  return <PermissionContext.Provider value={ctx}>{children}</PermissionContext.Provider>;
}

/** Raw viewer permissions ({ allowSet, orgRole, isSuperAdmin }) — null if no provider. */
export function useViewerPermissions(): ViewerPermissions | null {
  const ctx = useContext(PermissionContext);
  if (!ctx) return null;
  const { allowSet, orgRole, isSuperAdmin } = ctx;
  return { allowSet, orgRole, isSuperAdmin };
}

/**
 * Client `can()`. Receives FIELDS (never a hand-built key) and calls `buildKey`
 * internally — single source of the key format (cravada #3). super_admin bypasses
 * (mirrors the server `can()` exactly). FAIL-CLOSED: no provider / unknown → false.
 */
export function useCan(): (resource: ResourceType, action: ActionType, scope?: Scope) => boolean {
  const ctx = useContext(PermissionContext);
  return (resource, action, scope = { type: "ORG" }) => {
    if (!ctx) return false; // fail-closed
    if (ctx.isSuperAdmin) return true; // mirrors can.ts: if (actor.isSuperAdmin) return true
    return ctx.allow.has(buildKey(resource, action, scope.type, scope.id));
  };
}
