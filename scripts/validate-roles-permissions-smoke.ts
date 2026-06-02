#!/usr/bin/env tsx
import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { ROLE_PERMISSIONS } from "@/lib/permissions/role-permissions";
import {
  countActiveOwners,
  assertMemberBelongsToOrg,
  getOrgRole,
} from "@/lib/permissions/membership-roles";
import type { ResourceType, ActionType } from "@/lib/permissions";
import type { MemberRole } from "@prisma/client";

/**
 * Roles & Permissions smoke validator (one-shot, idempotent).
 *
 * Repeatable health check for the feature shipped in Etapas 1-3. It does NOT
 * duplicate the Etapa 2 integration tests (which mock auth to exercise the
 * route's HTTP status matrix) — it reuses the real matrix + helpers as a
 * health probe:
 *   1. Permissions matrix route responds (HTTP, best-effort against base-url).
 *   2. ROLE_PERMISSIONS matrix is well-formed (6 roles + key grants present).
 *   3. Owner-count + cross-org isolation helpers behave on seeded data.
 *
 * Usage:
 *   npm run smoke:roles-permissions
 *   npm run smoke:roles-permissions -- --base-url=https://herd-production.up.railway.app
 */

interface Args {
  baseUrl: string;
}

function parseArgs(argv: string[]): Args {
  let baseUrl = "http://localhost:3000";
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--base-url=")) baseUrl = arg.slice("--base-url=".length);
    else if (arg === "--base-url" && argv[i + 1]) baseUrl = argv[++i]!;
  }
  return { baseUrl };
}

interface CheckResult {
  name: string;
  ok: boolean;
  detail?: string;
  error?: string;
}

function hasGrant(
  role: MemberRole,
  resource: ResourceType,
  action: ActionType
): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).some(
    (g) => g.resource === resource && g.action === action
  );
}

async function main(): Promise<void> {
  const { baseUrl } = parseArgs(process.argv);
  const results: CheckResult[] = [];
  const log = (msg: string) => console.log(`[smoke:roles-permissions] ${msg}`);
  log(`Starting against ${baseUrl}`);

  // === Check 1: matrix route responds ===
  {
    try {
      const res = await fetch(`${baseUrl}/admin/organization/permissions`, {
        redirect: "manual",
      });
      // Unauthenticated request is expected to redirect to /login (3xx) or be
      // gated (401); either proves the route is wired. 404/5xx is a failure.
      const ok = [200, 301, 302, 307, 308, 401].includes(res.status);
      results.push({
        name: "Permissions matrix route responds",
        ok,
        detail: `HTTP ${res.status}`,
        error: ok ? undefined : `Unexpected status ${res.status}`,
      });
    } catch (err) {
      results.push({
        name: "Permissions matrix route responds",
        ok: false,
        error: `Could not reach ${baseUrl} (is the server running?): ${
          err instanceof Error ? err.message : String(err)
        }`,
      });
    }
  }

  // === Check 2: ROLE_PERMISSIONS matrix integrity ===
  {
    const roles = Object.keys(ROLE_PERMISSIONS) as MemberRole[];
    const checks = [
      roles.length === 6,
      hasGrant("OWNER", "org", "delete"),
      hasGrant("OWNER", "members", "create"),
      hasGrant("OWNER", "org_billing", "update"),
      !hasGrant("ADMIN", "org", "delete"),
      !hasGrant("ADMIN", "org_billing", "update"),
      hasGrant("ADMIN", "members", "create"),
      hasGrant("MEMBER", "blocks_data", "create"),
      !hasGrant("MEMBER", "members", "create"),
    ];
    const ok = checks.every(Boolean);
    results.push({
      name: "ROLE_PERMISSIONS matrix integrity",
      ok,
      detail: `${roles.length} roles; OWNER⊃ADMIN⊃MEMBER grants consistent`,
      error: ok ? undefined : "Matrix grants diverged from expected model",
    });
  }

  // === Check 3: owner-count + cross-org isolation (real helpers) ===
  const tag = `smoke-rp-${Date.now()}`;
  const createdOrgIds: string[] = [];
  const createdProfileIds: string[] = [];
  const seedMember = async (
    orgId: string,
    role: MemberRole
  ): Promise<string> => {
    const profile = await prisma.networkProfile.create({
      data: {
        firstName: "Smoke",
        lastName: "RP",
        email: `${tag}-${Math.random().toString(36).slice(2, 9)}@example.com`,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    createdProfileIds.push(profile.id);
    const member = await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        networkProfileId: profile.id,
        status: "ACTIVE",
        roles: { create: { role, scopeType: "ORG" } },
      },
      select: { id: true },
    });
    return member.id;
  };

  try {
    const orgA = await prisma.organization.create({
      data: { slug: `${tag}-a`, subdomain: `${tag}-a`, name: "Smoke Org A" },
      select: { id: true },
    });
    const orgB = await prisma.organization.create({
      data: { slug: `${tag}-b`, subdomain: `${tag}-b`, name: "Smoke Org B" },
      select: { id: true },
    });
    createdOrgIds.push(orgA.id, orgB.id);

    await seedMember(orgA.id, "OWNER");
    await seedMember(orgA.id, "OWNER");
    const memberA = await seedMember(orgA.id, "MEMBER");
    const memberB = await seedMember(orgB.id, "MEMBER");

    const ownersA = await countActiveOwners(orgA.id);
    const ownersB = await countActiveOwners(orgB.id);
    const sameOrg = await assertMemberBelongsToOrg(memberA, orgA.id);
    const crossOrg = await assertMemberBelongsToOrg(memberB, orgA.id);

    const ownerCountOk = ownersA === 2 && ownersB === 0;
    const isolationOk =
      sameOrg !== null &&
      getOrgRole(sameOrg)?.role === "MEMBER" &&
      crossOrg === null;

    results.push({
      name: "Owner-count invariant helper",
      ok: ownerCountOk,
      detail: `countActiveOwners(A)=${ownersA} (exp 2), (B)=${ownersB} (exp 0)`,
      error: ownerCountOk ? undefined : "countActiveOwners diverged",
    });
    results.push({
      name: "Cross-org isolation helper",
      ok: isolationOk,
      detail: "same-org resolves; cross-org id returns null (→404)",
      error: isolationOk ? undefined : "assertMemberBelongsToOrg leaked or misresolved",
    });
  } finally {
    // Cleanup (cascade removes members + roles).
    if (createdOrgIds.length) {
      await prisma.organization.deleteMany({
        where: { id: { in: createdOrgIds } },
      });
    }
    if (createdProfileIds.length) {
      await prisma.networkProfile.deleteMany({
        where: { id: { in: createdProfileIds } },
      });
    }
  }

  // === Summary ===
  log("");
  log("=== ROLES & PERMISSIONS SMOKE RESULTS ===");
  let failCount = 0;
  results.forEach((r, i) => {
    log(`${r.ok ? "✓" : "✗"} Check ${i + 1}: ${r.name}`);
    if (r.detail) log(`   ${r.detail}`);
    if (r.error) log(`   ERROR: ${r.error}`);
    if (!r.ok) failCount++;
  });
  log("");
  log(`Total: ${results.length - failCount} passed, ${failCount} failed`);

  await prisma.$disconnect();

  if (failCount > 0) process.exit(1);
  log("✓✓✓ ALL CHECKS PASSED — Roles & Permissions smoke validated ✓✓✓");
  process.exit(0);
}

main().catch((err) => {
  console.error("[smoke:roles-permissions] FATAL:", err);
  process.exit(1);
});
