#!/usr/bin/env tsx
import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Sub-etapa 17.0.1 — MemberConnection seed (cross-provider).
 *
 * Idempotent upsert by `@@unique([profileId, integrationId])`. The webhook
 * tenant resolver depends on this row for `findFirst({ externalUserId,
 * integration: { slug } })` to succeed; without it, real webhooks return
 * 400 "tenant not found".
 *
 * ### Sub-etapa 17.0.2 fix — RLS bypass
 *
 * `member_connections` has the strict RLS policy `mc_tenant_isolation`
 * (Sub-etapa 4). The shared runtime singleton (`@/lib/prisma`) connects
 * via `RUNTIME_DATABASE_URL` (role `herd_app`, `NOBYPASSRLS`), so any
 * INSERT/UPDATE without an active `app.tenant_id` GUC fails with code
 * 42501 ("new row violates row-level security policy"). Seed scripts
 * provision cross-tenant rows from a CLI context where there is no
 * tenant GUC to set — so they must use an **admin client bound to
 * `DATABASE_URL`** (role `postgres`, which bypasses RLS). This is the
 * canonical pattern documented in AGENTS.md ("Test architecture —
 * two-connection pattern") and already used by `tenant-resolver.ts`
 * (the one read-side exception).
 *
 * Do NOT switch this script to use `@/lib/prisma`. The runtime singleton
 * is intentionally RLS-enforcing; bypassing RLS at runtime is the
 * defense-in-depth violation we are guarding against. Admin operations
 * (migrations, seeds, cross-tenant audits) use a separate client by
 * design.
 *
 * ### Usage
 *
 *   npm run seed:braintree-connection -- --tenant=<orgId> --profile=<profileId>
 *   npm run seed:recharge-connection  -- --tenant=<orgId> --profile=<profileId>
 *   npm run seed:connection           -- --slug=<provider> ...
 *
 * Auto-detection (single-row inference) for `tenant` and `profile` works
 * only when exactly one Organization / NetworkProfile exists. Pass
 * `--tenant=<id>` / `--profile=<id>` explicitly otherwise.
 *
 * `externalUserId` is per-provider semantics:
 *   - braintree: `BRAINTREE_MERCHANT_ID`
 *   - recharge:  `RECHARGE_SHOP_ID` or `RECHARGE_MERCHANT_ID`
 *   Override via `--external-id=<value>`.
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

/**
 * Admin client bound to `DATABASE_URL` (role `postgres`, bypasses RLS).
 * See module-level docblock for the rationale.
 */
function makeAdminClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!url) {
    throw new Error(
      "seed:connection: DATABASE_URL or DIRECT_URL must be set (admin/bypass connection required to seed tenant-scoped rows).",
    );
  }
  return new PrismaClient({ adapter: new PrismaPg(url) });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const slug = args.slug as SupportedSlug;
  const prisma = makeAdminClient();

  try {
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
      });
      if (orgs.length === 0) {
        throw new Error("No Organization rows in DB. Create one first.");
      }
      if (orgs.length > 1) {
        console.error(
          `Multiple Organizations found (${orgs.length}). Specify --tenant=<orgId>:`,
        );
        orgs.forEach((o) => console.error(`  ${o.id}  ${o.name}`));
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
      });
      if (profiles.length === 0) {
        throw new Error("No NetworkProfile rows in DB. Create one first.");
      }
      if (profiles.length > 1) {
        console.error(
          `Multiple NetworkProfiles found (${profiles.length}). Specify --profile=<profileId>:`,
        );
        profiles.forEach((p) =>
          console.error(
            `  ${p.id}  ${p.firstName} ${p.lastName} <${p.email}>`,
          ),
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

    // 5. Upsert MemberConnection. Admin client bypasses RLS — see module
    //    docblock. Idempotent via `@@unique([profileId, integrationId])`.
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
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[seed:connection] FATAL:", err);
  process.exit(1);
});
