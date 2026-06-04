/**
 * Cleanup — remove the test membership of nick@comecaai.com.br in Bucked Up.
 *
 * The end-to-end accept test created an ACTIVE MEMBER membership for
 * nick@comecaai.com.br in the Bucked Up org. There is no "remove member" path
 * in the app, so this reverts the test artifact directly: a hard DELETE of the
 * OrganizationMember row (its MembershipRole rows cascade via
 * onDelete: Cascade). The ACCEPTED invitation row is left as history.
 *
 * Default = DRY-RUN. `--commit` deletes after re-validating (email + org + role
 * MEMBER + status ACTIVE). Touches only that one membership; jeff@ OWNER intact.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const MEMBER_ID = "9180602d-b97a-473b-b10d-1088953deda7";
const ORG_ID = "b0402334-ec9e-49d5-aa22-ce35f8d50d9e";
const EXPECTED_EMAIL = "nick@comecaai.com.br";

const cs = (process.env.RUNTIME_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim();
const prisma = new PrismaClient({ adapter: new PrismaPg(cs) });
const COMMIT = process.argv.includes("--commit");

function fail(msg: string): never {
  console.error("✋ ABORT (no write):", msg);
  process.exit(1);
}

async function main() {
  const m = await prisma.organizationMember.findUnique({
    where: { id: MEMBER_ID },
    select: {
      id: true, organizationId: true, status: true,
      networkProfile: { select: { email: true } },
      roles: { select: { role: true } },
    },
  });
  if (!m) fail(`membership ${MEMBER_ID} not found`);
  if (m.organizationId !== ORG_ID) fail(`org ${m.organizationId} !== expected ${ORG_ID}`);
  if (m.networkProfile?.email !== EXPECTED_EMAIL) fail(`email "${m.networkProfile?.email}" !== expected "${EXPECTED_EMAIL}"`);
  const roles = m.roles.map((r) => r.role);
  if (m.status !== "ACTIVE" || roles.length !== 1 || roles[0] !== "MEMBER") {
    fail(`unexpected status/roles: status=${m.status} roles=[${roles.join(",")}] (expected ACTIVE / [MEMBER])`);
  }

  console.log("=== REMOVE test membership (mode: " + (COMMIT ? "COMMIT" : "DRY-RUN") + ") ===");
  console.log(`  would DELETE OrganizationMember ${m.id} (${m.networkProfile?.email}, status=${m.status}, roles=[${roles.join(",")}]) in org ${m.organizationId}`);
  console.log("  (MembershipRole rows cascade via onDelete: Cascade)");

  if (!COMMIT) {
    console.log("\nDRY-RUN — nothing written. Re-run with --commit to apply.");
  } else {
    await prisma.$transaction((tx) => tx.organizationMember.delete({ where: { id: MEMBER_ID } }));
    console.log("\n✅ DELETED.");
  }

  const remaining = await prisma.organizationMember.findMany({
    where: { organizationId: ORG_ID },
    select: { status: true, networkProfile: { select: { email: true } }, roles: { select: { role: true } } },
  });
  console.log("\n=== Bucked Up members " + (COMMIT ? "after" : "currently") + " ===");
  remaining.forEach((r) => console.log("  ", r.networkProfile?.email, r.status, "[" + r.roles.map((x) => x.role).join(",") + "]"));
}
main().then(() => process.exit(0)).catch((e) => { console.error("ERR:", e.message); process.exit(1); });
