import type { ResourceType, ActionType } from "./types";

/**
 * Editable grant surface for custom roles (R&P Fase 7c-2a). Mirrors the proven
 * super-admin matrix editor: the 5 routed resources × the 5 actions, ORG scope.
 * Non-routed cells (e.g. `org:create`) are inert — no route checks them — same
 * as the global matrix. Ghost resources (org_settings, org_billing, audit_log,
 * integrations, blocks_schema, blocks_data) are excluded: granting them is a
 * no-op until they gain a route.
 *
 * Client-safe (no server imports) so both the route handler and the editor UI
 * share one source of truth.
 */
export const GRANT_RESOURCES = [
  "org",
  "org_hierarchy",
  "members",
  "departments",
  "locations",
] as const satisfies readonly ResourceType[];

export const GRANT_ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
  "invite",
] as const satisfies readonly ActionType[];

export type GrantResource = (typeof GRANT_RESOURCES)[number];
export type GrantAction = (typeof GRANT_ACTIONS)[number];
