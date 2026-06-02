import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma, type RoleScopeType } from "@prisma/client";
import { ROLE_PERMISSIONS } from "@/lib/permissions/role-permissions";

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
export async function seedRolePermissions(
  db: PrismaClient | Prisma.TransactionClient
): Promise<number> {
  // Build all grant rows from the constant, then a single createMany with
  // skipDuplicates — idempotent (the @@unique compound key dedups on re-run)
  // and one round-trip (97 sequential upserts blew the test hook timeout).
  const data = (
    Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]
  ).flatMap((role) =>
    ROLE_PERMISSIONS[role].map((grant) => {
      const scopeType: RoleScopeType =
        grant.scopeType === "department" ? "DEPARTMENT" : "ORG";
      return { role, resource: grant.resource, action: grant.action, scopeType };
    })
  );
  await db.rolePermission.createMany({ data, skipDuplicates: true });
  return data.length;
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
