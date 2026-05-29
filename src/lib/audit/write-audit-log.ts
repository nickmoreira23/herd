import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenancy/context";

/**
 * Input for {@link writeAuditLog}.
 *
 * - `tenantId`     — the organization the action belongs to. Drives both the
 *                    `withTenant` scope (so the tenant-scoping Prisma Extension
 *                    injects `tenant_id` and sets the RLS GUC) and the row's
 *                    `tenant_id` value.
 * - `actorProfileId` — the NetworkProfile that PERFORMED the action. May be
 *                    `null` when no profile context exists. `null` is also the
 *                    resting state after the actor profile is deleted
 *                    (FK `ON DELETE SET NULL`).
 * - `action`       — free-form verb in `{aggregate}.{verb}` form, e.g.
 *                    `"invitation.created"`, `"department.deleted"`.
 * - `resourceType` — coarse resource kind, e.g. `"invitation"`, `"department"`.
 * - `resourceId`   — the affected resource's identifier. TEXT (not necessarily
 *                    a UUID) — covers invitation tokens as well as UUID PKs.
 * - `metadata`     — optional JSON blob with extra context (defaults to `{}`).
 */
export interface WriteAuditLogInput {
  tenantId: string;
  actorProfileId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Append a row to the strict tenant-scoped `audit_logs` table.
 *
 * Contract:
 * - **Best-effort, non-fatal.** Any failure is swallowed and logged — writing
 *   an audit row must NEVER roll back or break the business action it records.
 * - **Opens its OWN `withTenant`.** The `audit_logs` RLS policy requires the
 *   `app.tenant_id` GUC to be set and the Extension to inject `tenant_id` on
 *   insert. By wrapping the write in `withTenant(tenantId, ...)` the helper is
 *   correct whether or not the caller is already inside a tenant scope —
 *   the invitation service uses the plain `prisma` singleton (no `withTenant`),
 *   while the departments/locations/org-chart routes already run inside one.
 *   Nesting `withTenant` is safe (AsyncLocalStorage re-entrancy).
 * - **`tenantId` is passed explicitly in `data`** to satisfy the Prisma type
 *   (the model requires it). At runtime the tenant-scoping Extension also
 *   injects it from the active `withTenant` context — both resolve to the
 *   same value, matching the `billingEvent.create` / departments-locations
 *   write precedent.
 */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  try {
    await withTenant(input.tenantId, async () =>
      prisma.auditLog.create({
        data: {
          tenantId: input.tenantId,
          actorProfileId: input.actorProfileId,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          metadata: input.metadata ?? {},
        },
      })
    );
  } catch (err) {
    // Non-fatal: never let an audit failure break the business action.
    console.error("[audit] writeAuditLog failed (non-fatal)", {
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
