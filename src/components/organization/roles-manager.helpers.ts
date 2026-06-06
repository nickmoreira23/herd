import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

/** Derive a kebab-case key from a free-text role name. */
export function toKebab(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Map a 422 error body from the /roles endpoints to an i18n key. The endpoints
 * return distinct prose (no machine code today — Fase 7c-1 is zero-backend), so
 * we match on the message. Unknown → generic invalid.
 */
export function roleErrorKey(errorMsg: string): MessageKey {
  if (/already exists/i.test(errorMsg)) return "organization.roles.error.duplicate";
  if (/collides/i.test(errorMsg)) return "organization.roles.error.reserved";
  return "organization.roles.error.invalid";
}

/**
 * Mutation gate (R&P Fase 7c-1, UX-only). Create/edit/delete is OWNER-only —
 * finer than the roles.create grant (O_A): ADMIN sees the list read-only.
 * super_admin bypasses. Returns false while the viewer is unresolved (null).
 */
export function canMutateRoles(
  viewer: { isSuperAdmin: boolean; orgRole: string | null | undefined } | null,
): boolean {
  if (!viewer) return false;
  return viewer.isSuperAdmin || viewer.orgRole === "OWNER";
}
