#!/usr/bin/env tsx
import "dotenv/config";

import { prisma } from "@/lib/prisma";

/**
 * Sub-etapa 17.0.1 — MemberConnection seed (cross-provider).
 *
 * Idempotent upsert by `@@unique([profileId, integrationId])`. The webhook
 * tenant resolver depends on this row for `findFirst({ externalUserId,
 * integration: { slug } })` to succeed; without it, real webhooks return
 * 400 "tenant not found".
 *
 * Auto-detection (single-row inference) for `tenant` and `profile` works
 * only when exactly one Organization / NetworkProfile exists in the DB.
 * Pass `--tenant=<id>` / `--profile=<id>` explicitly when there are multiple.
 *
 * `externalUserId` is per-provider semantics:
 *   - braintree: BRAINTREE_MERCHANT_ID
 *   - recharge:  RECHARGE_SHOP_ID or RECHARGE_MERCHANT_ID
 *   Override via `--external-id=<value>`.
 *
 * Usage:
 *   npm run seed:braintree-connection -- --tenant=<orgId> --profile=<profileId>
 *   npm run seed:recharge-connection  -- --tenant=<orgId> --profile=<profileId>
 *   npm run seed:connection           -- --slug=<provider> ...
 */

interface Args {
  slug: string;
  tenant?: string;
  profile?: string;
  externalId?: string;
}

const SUPPORTED_SLUGS = ["braintree", "recharge"] as const;
type SupportedSlug = (typeof SUPPORTED_SLUGS)[number];

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--slug=")) args.slug = arg.slice("--slug=".length);
    else if (arg.startsWith("--tenant=")) args.tenant = arg.slice("--tenant=".length);
    else if (arg.startsWith("--profile=")) args.profile = arg.slice("--profile=".length);
    else if (arg.startsWith("--external-id=")) args.externalId = arg.slice("--external-id=".length);
    else if (arg === "--slug" && argv[i + 1]) args.slug = argv[++i]!;
    else if (arg === "--tenant" && argv[i + 1]) args.tenant = argv[++i]!;
    else if (arg === "--profile" && argv[i + 1]) args.profile = argv[++i]!;
    else if (arg === "--external-id" && argv[i + 1]) args.externalId = argv[++i]!;
  }

  if (!args.slug) {
    console.error("Missing required --slug arg.");
    console.error("");
    console.error("Usage: tsx scripts/seed-member-connection.ts --slug=<braintree|recharge>");
    console.error("  [--tenant=<orgId>]      # auto-detects single org if omitted");
    console.error("  [--profile=<profileId>] # auto-detects single profile if omitted");
    console.error("  [--external-id=<id>]    # auto-reads from .env if omitted");
    process.exit(1);
  }

  if (!SUPPORTED_SLUGS.includes(args.slug as SupportedSlug)) {
    console.error(
      `Invalid --slug: "${args.slug}". Supported: ${SUPPORTED_SLUGS.join(", ")}`,
    );
    process.exit(1);
  }

  return args as Args;
}

function resolveExternalIdFromEnv(slug: SupportedSlug): string | null {
  if (slug === "braintree") {
    return process.env.BRAINTREE_MERCHANT_ID ?? null;
  }
  if (slug === "recharge") {
    return (
      process.env.RECHARGE_SHOP_ID ??
      process.env.RECHARGE_MERCHANT_ID ??
      null
    );
  }
  return null;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const slug = args.slug as SupportedSlug;

  console.log(`[seed:connection] Seeding MemberConnection for slug="${slug}"`);

  // 1. Resolve Integration.
  const integration = await prisma.integration.findUnique({
    where: { slug },
    select: { id: true, name: true, status: true },
  });
  if (!integration) {
    throw new Error(
      `Integration "${slug}" not found. Run npm run seed:${slug} first.`,
    );
  }
  console.log(
    `  Integration: ${integration.name} (id=${integration.id}, status=${integration.status})`,
  );

  // 2. Resolve tenant.
  let tenantId: string;
  if (args.tenant) {
    tenantId = args.tenant;
  } else {
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true },
      take: 5,
    });
    if (orgs.length === 0) {
      throw new Error("No Organization rows in DB. Create one first.");
    }
    if (orgs.length > 1) {
      console.error("Multiple Organizations found. Specify --tenant=<orgId>:");
      orgs.forEach((o) =>
        console.error(`  ${o.id}  ${o.name}`),
      );
      process.exit(1);
    }
    tenantId = orgs[0]!.id;
    console.log(`  Tenant (auto-detected): ${orgs[0]!.name} (${tenantId})`);
  }

  // 3. Resolve profile.
  let profileId: string;
  if (args.profile) {
    profileId = args.profile;
  } else {
    const profiles = await prisma.networkProfile.findMany({
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 5,
    });
    if (profiles.length === 0) {
      throw new Error("No NetworkProfile rows in DB. Create one first.");
    }
    if (profiles.length > 1) {
      console.error("Multiple NetworkProfiles found. Specify --profile=<profileId>:");
      profiles.forEach((p) =>
        console.error(`  ${p.id}  ${p.firstName} ${p.lastName} <${p.email}>`),
      );
      process.exit(1);
    }
    const p = profiles[0]!;
    profileId = p.id;
    console.log(
      `  Profile (auto-detected): ${p.firstName} ${p.lastName} <${p.email}> (${profileId})`,
    );
  }

  // 4. Resolve externalUserId.
  let externalUserId: string;
  if (args.externalId) {
    externalUserId = args.externalId;
  } else {
    const fromEnv = resolveExternalIdFromEnv(slug);
    if (!fromEnv) {
      const envHint =
        slug === "braintree"
          ? "BRAINTREE_MERCHANT_ID"
          : "RECHARGE_SHOP_ID or RECHARGE_MERCHANT_ID";
      throw new Error(
        `Cannot resolve externalUserId. Set ${envHint} in .env OR pass --external-id=<id>.`,
      );
    }
    externalUserId = fromEnv;
  }
  const fingerprint =
    externalUserId.length > 12
      ? `${externalUserId.slice(0, 4)}...${externalUserId.slice(-4)}`
      : "<short>";
  console.log(
    `  externalUserId fingerprint: ${fingerprint} (length=${externalUserId.length})`,
  );

  // 5. Upsert MemberConnection (idempotent via @@unique([profileId, integrationId])).
  const existing = await prisma.memberConnection.findFirst({
    where: { profileId, integrationId: integration.id },
    select: { id: true, externalUserId: true },
  });

  if (existing) {
    await prisma.memberConnection.update({
      where: { id: existing.id },
      data: { externalUserId, tenantId, status: "ACTIVE" },
    });
    console.log(`[seed:connection] Updated MemberConnection id=${existing.id}`);
  } else {
    const created = await prisma.memberConnection.create({
      data: {
        tenantId,
        profileId,
        integrationId: integration.id,
        externalUserId,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    console.log(`[seed:connection] Created MemberConnection id=${created.id}`);
  }

  console.log(`✓ MemberConnection ready for ${slug}.`);
}

main()
  .catch((err) => {
    console.error("[seed:connection] FATAL:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
