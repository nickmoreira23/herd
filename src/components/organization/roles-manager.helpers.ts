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
 * Map a 422 error CODE from the /roles endpoints to an i18n key (Fase 7c-2a:
 * the endpoints now emit stable codes — never matched by prose). Unknown →
 * generic invalid.
 */
export function roleErrorKey(code: string): MessageKey {
  if (code === "key_duplicate") return "organization.roles.error.duplicate";
  if (code === "name_reserved") return "organization.roles.error.reserved";
  return "organization.roles.error.invalid";
}

/**
 * Render a 400 validation body (`{ details: zodError.flatten() }`) as a short
 * inline detail line, e.g. "description: Expected string, received null". The
 * zod messages are API-side English — shown raw as contract diagnostics, after
 * the translated generic message. Empty/malformed details → null.
 */
export function formatFieldErrors(details: unknown): string | null {
  const fieldErrors = (details as { fieldErrors?: Record<string, string[]> } | null)
    ?.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") return null;
  const parts = Object.entries(fieldErrors)
    .filter(([, msgs]) => Array.isArray(msgs) && msgs.length > 0)
    .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`);
  return parts.length > 0 ? parts.join("; ") : null;
}

/** Map the grant-editor endpoint's stable error codes to an i18n key. */
export function grantErrorKey(code: string): MessageKey {
  if (code === "role_not_found") return "organization.roles.grants.role_not_found";
  if (code === "invalid_grant") return "organization.roles.grants.invalid_grant";
  return "organization.roles.grants.save_error";
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
