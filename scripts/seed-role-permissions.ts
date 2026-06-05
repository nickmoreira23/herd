import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type Prisma,
  type RoleScopeType,
  type MemberRole,
} from "@prisma/client";
import { ROLE_PERMISSIONS } from "@/lib/permissions/role-permissions";
import { bulkEnsureGrants, type GrantSlot } from "@/lib/permissions/grant-repository";

/**
 * V3.1 — materialize the hardcoded ROLE_PERMISSIONS into the global
 * `role_permissions` table. Idempotent (upsert by the @@unique compound key;
 * empty update → re-running yields the same state). NOTHING reads this table
 * yet (can() still reads the constant) — it exists to be seeded + proven equal
 * to the constant by the parity test, ahead of the V3.2 async read.
 *
 * `Permission.scopeType` is the lowercase model literal ("department" | undefined);
 * absent → the ORG-level grant. Mapped to the Prisma `RoleScopeType` enum here.
 */
export interface RolePermissionRow {
  role: MemberRole;
  resource: string;
  action: string;
  scopeType: RoleScopeType;
}

/**
 * Pure mapping of the hardcoded ROLE_PERMISSIONS → table rows. Exported so the
 * parity test can assert the seed PRODUCES exactly the constant without touching
 * the DB (post-V3.3 the live table may diverge via the editor — see the test).
 */
export function rolePermissionRows(): RolePermissionRow[] {
  return (
    Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]
  ).flatMap((role) =>
    ROLE_PERMISSIONS[role].map((grant) => ({
      role: role as MemberRole,
      resource: grant.resource,
      action: grant.action,
      scopeType: (grant.scopeType === "department"
        ? "DEPARTMENT"
        : "ORG") as RoleScopeType,
    }))
  );
}

export async function seedRolePermissions(
  db: PrismaClient | Prisma.TransactionClient
): Promise<number> {
  // Fase 6a: the legacy @@unique was dropped, so skipDuplicates no longer dedups.
  // Route through the grant choke point's slot-safe bulk path: inserts only the
  // system-global slots not already present (idempotent, no dup, no churn).
  const slots: GrantSlot[] = rolePermissionRows().map((r) => ({
    tenantId: null,
    role: r.role,
    roleId: null,
    resource: r.resource,
    action: r.action,
    scopeType: r.scopeType,
  }));
  return bulkEnsureGrants(db, slots);
}

async function main() {
  const url =
    process.env.RUNTIME_DATABASE_URL ??
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL;
  if (!url) throw new Error("No database URL in env");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  const n = await seedRolePermissions(prisma);
  const total = await prisma.rolePermission.count();
  console.log(`[seed:role-permissions] upserted ${n} grants; table now has ${total} rows.`);
  await prisma.$disconnect();
}

// Run as CLI only (not when imported by the parity test).
if (process.argv[1] && process.argv[1].includes("seed-role-permissions")) {
  main().catch((e) => {
    console.error("[seed:role-permissions] FATAL:", e);
    process.exit(1);
  });
}
