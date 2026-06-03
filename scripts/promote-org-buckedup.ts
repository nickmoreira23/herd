/**
 * SE-5 Fase 2a — promote the personal org "Personal — jeff@buckedup.com" to the
 * institutional "Bucked Up" org (decision B). PROD mutation, guarded.
 *
 * Default = DRY-RUN (prints before → after, writes nothing).
 * Pass `--commit` to apply the 4 field updates in a single transaction.
 *
 * Preconditions (abort with a clear error, no write, if any fails):
 *   - target org exists and its current name === EXPECTED_CURRENT_NAME
 *   - target subdomain/customDomain/slug are still the personal values
 *   - the new subdomain / customDomain / slug are FREE (no other org holds them)
 *
 * Routing note: resolveOrgByHost matches `customDomain` (exact) then `subdomain`
 * — never `slug`. `slug` is updated only for consistency (it's surfaced in the
 * memberships API / org selector); it does not affect host routing.
 *
 * Does NOT touch OrganizationMember/roles or any other org.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const TARGET_ID = "b0402334-ec9e-49d5-aa22-ce35f8d50d9e";
const EXPECTED_CURRENT_NAME = "Personal — jeff@buckedup.com";

const NEW = {
  name: "Bucked Up",
  subdomain: "buckedup",
  customDomain: "herd.buckedup.com",
  slug: "buckedup",
} as const;

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

async function freeOrFail(
  field: "subdomain" | "customDomain" | "slug",
  value: string
) {
  const hit = await prisma.organization.findUnique({
    where: { [field]: value } as never,
    select: { id: true, name: true },
  });
  if (hit && hit.id !== TARGET_ID) {
    fail(`${field}="${value}" already taken by ${hit.name} (${hit.id})`);
  }
}

async function main() {
  const org = await prisma.organization.findUnique({
    where: { id: TARGET_ID },
    select: {
      id: true,
      name: true,
      slug: true,
      subdomain: true,
      customDomain: true,
      status: true,
    },
  });
  if (!org) fail(`target org ${TARGET_ID} not found`);
  if (org.name !== EXPECTED_CURRENT_NAME) {
    fail(
      `current name "${org.name}" !== expected "${EXPECTED_CURRENT_NAME}" — refusing to touch a different org`
    );
  }

  await freeOrFail("subdomain", NEW.subdomain);
  await freeOrFail("customDomain", NEW.customDomain);
  await freeOrFail("slug", NEW.slug);

  console.log("=== PROMOTE org → Bucked Up (mode: " + (COMMIT ? "COMMIT" : "DRY-RUN") + ") ===");
  const rows: Array<[string, unknown, unknown]> = [
    ["name", org.name, NEW.name],
    ["subdomain", org.subdomain, NEW.subdomain],
    ["customDomain", org.customDomain, NEW.customDomain],
    ["slug", org.slug, NEW.slug],
  ];
  for (const [f, before, after] of rows) {
    console.log(`  ${f}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  }

  if (!COMMIT) {
    console.log("\nDRY-RUN — nothing written. Re-run with --commit to apply.");
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    return tx.organization.update({
      where: { id: TARGET_ID },
      data: {
        name: NEW.name,
        subdomain: NEW.subdomain,
        customDomain: NEW.customDomain,
        slug: NEW.slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        customDomain: true,
        status: true,
      },
    });
  });

  console.log("\n✅ COMMITTED. Final state:");
  console.log(JSON.stringify(updated, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERR:", e.message);
    process.exit(1);
  });
