/**
 * Fix-1 — restore platform super_admin for nick@comecaai.com.br.
 *
 * Discovery found network_profiles.is_super_admin = false for this profile,
 * but STATE declares it the platform super_admin. Without the flag,
 * requireOrgRole (which reads isSuperAdmin from the DB per-request via
 * getActor) does not bypass, so org pages bounce on orgs he isn't a member of.
 *
 * Default = DRY-RUN. `--commit` applies UPDATE ... WHERE id = TARGET_ID (by id,
 * not email) in a transaction, after re-validating (email matches, flag is
 * currently false). Touches only that one row / one column.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const TARGET_ID = "1d2ca8e4-fcef-43d8-bf32-999fdf7d7e6f";
const EXPECTED_EMAIL = "nick@comecaai.com.br";

const cs = (
  process.env.RUNTIME_DATABASE_URL ||
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  ""
).trim();
const prisma = new PrismaClient({ adapter: new PrismaPg(cs) });
const COMMIT = process.argv.includes("--commit");

function fail(msg: string): never {
  console.error("✋ ABORT (no write):", msg);
  process.exit(1);
}

async function main() {
  const before = await prisma.networkProfile.findUnique({
    where: { id: TARGET_ID },
    select: { id: true, email: true, isSuperAdmin: true },
  });
  if (!before) fail(`profile ${TARGET_ID} not found`);
  if (before.email !== EXPECTED_EMAIL) {
    fail(`email "${before.email}" !== expected "${EXPECTED_EMAIL}" — refusing to touch a different profile`);
  }
  if (before.isSuperAdmin === true) {
    console.log("Already isSuperAdmin=true — nothing to do.");
    return;
  }

  console.log("=== RESTORE super_admin (mode: " + (COMMIT ? "COMMIT" : "DRY-RUN") + ") ===");
  console.log(`  id: ${before.id}`);
  console.log(`  email: ${before.email}`);
  console.log(`  isSuperAdmin: ${before.isSuperAdmin} → true`);

  if (!COMMIT) {
    console.log("\nDRY-RUN — nothing written. Re-run with --commit to apply.");
    return;
  }

  const after = await prisma.$transaction((tx) =>
    tx.networkProfile.update({
      where: { id: TARGET_ID },
      data: { isSuperAdmin: true },
      select: { id: true, email: true, isSuperAdmin: true },
    }),
  );
  console.log("\n✅ COMMITTED. Final:");
  console.log(JSON.stringify(after, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERR:", e.message);
    process.exit(1);
  });
