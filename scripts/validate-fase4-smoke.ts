#!/usr/bin/env tsx
import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { ROLE_PERMISSIONS } from "@/lib/permissions/role-permissions";
import { can } from "@/lib/permissions/can";
import { assertMemberBelongsToOrg } from "@/lib/permissions/membership-roles";
import { resolveOrgByHost, _resetOrgResolverCache } from "@/lib/tenant/org-resolver";
import { createInvitation, acceptInvitation } from "@/lib/invitations/invitation-service";
import type { Actor, Permission, ResourceType, ActionType } from "@/lib/permissions";
import type { MemberRole } from "@prisma/client";

/**
 * Fase 4 smoke validator (one-shot, idempotent, seed + teardown).
 *
 * Mirrors scripts/validate-roles-permissions-smoke.ts: a tsx standalone health
 * probe that reuses the REAL helpers (no reimplemented logic) and seeds minimal
 * data against DEV, tearing it down in `finally`. Covers the Fase 4 surfaces
 * that had real regressions: RBAC matrix, tenant isolation (#143/#144), domain
 * routing, and the invite accept e2e flow.
 *
 * ⚠️ Seeds orgs/profiles/members → REFUSES to run against PROD (a smoke seeding
 * PROD is exactly what left the test-tenancy-* orgs polluting production).
 *
 * Usage (DEV only): npm run smoke:fase4
 */

// Supabase project refs (CLAUDE.md DB-isolation): DEV is dedicated, PROD intact.
const DEV_REF = "krhkgaghhjudckormcgp";
const PROD_REF = "kwhufgbdmqvesfzriolc";
const APEX = "comecaai.com.br";

interface CheckResult {
  name: string;
  ok: boolean;
  detail?: string;
  error?: string;
}

function hasGrant(role: MemberRole, resource: ResourceType, action: ActionType): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).some((g) => g.resource === resource && g.action === action);
}

function actorFor(memberships: Actor["memberships"], isSuperAdmin = false): Actor {
  return { profileId: `smoke-${Math.random().toString(36).slice(2, 9)}`, isSuperAdmin, memberships };
}

/** Anti-PROD guardrail — runs BEFORE any seed. Default-deny: only localhost or
 * the known DEV project ref run free; the PROD ref is hard-blocked even with the
 * override flag; anything else requires --i-know-this-is-not-prod. */
function assertNotProd(log: (m: string) => void): void {
  // All conn URLs (RUNTIME uses `herd_app.<ref>`, others `postgres.<ref>`); match
  // the project ref by substring, not by role prefix.
  const conn = (process.env.RUNTIME_DATABASE_URL || process.env.DATABASE_URL || process.env.DIRECT_URL || "").trim();
  const isLocal = /localhost|127\.0\.0\.1/.test(conn);
  const isProd = conn.includes(PROD_REF) || /herd-production/.test(conn);
  const isDev = conn.includes(DEV_REF);
  const override = process.argv.includes("--i-know-this-is-not-prod");

  if (!conn) {
    log(`✋ ABORT: no DB connection string in env (RUNTIME_DATABASE_URL/DATABASE_URL/DIRECT_URL). Cannot verify target is not PROD.`);
    process.exit(1);
  }
  if (isProd) {
    log(`✋ ABORT: target DB is PRODUCTION. smoke:fase4 refuses to seed PROD.`);
    process.exit(1);
  }
  if (isLocal || isDev) {
    log(`target DB OK (${isLocal ? "localhost" : "DEV project"}).`);
    return;
  }
  if (!override) {
    log(`✋ ABORT: target DB is neither localhost nor the known DEV project. ` +
      `Re-run with --i-know-this-is-not-prod ONLY if you are certain this is not production.`);
    process.exit(1);
  }
  log(`⚠️ non-DEV target accepted via --i-know-this-is-not-prod.`);
}

async function main(): Promise<void> {
  const results: CheckResult[] = [];
  const log = (msg: string) => console.log(`[smoke:fase4] ${msg}`);
  log("Starting Fase 4 smoke");

  assertNotProd(log);

  const tag = `smoke-f4-${Date.now()}`;
  const createdOrgIds: string[] = [];
  const createdProfileIds: string[] = [];

  const seedProfile = async (label: string): Promise<string> => {
    const p = await prisma.networkProfile.create({
      data: { firstName: "Smoke", lastName: label, email: `${tag}-${label}-${Math.random().toString(36).slice(2, 7)}@example.com`, status: "ACTIVE" },
      select: { id: true },
    });
    createdProfileIds.push(p.id);
    return p.id;
  };
  const seedMember = async (orgId: string, profileId: string, role: MemberRole): Promise<string> => {
    const m = await prisma.organizationMember.create({
      data: { organizationId: orgId, networkProfileId: profileId, status: "ACTIVE", roles: { create: { role, scopeType: "ORG" } } },
      select: { id: true },
    });
    return m.id;
  };

  try {
    // === A) RBAC matrix integrity (real ROLE_PERMISSIONS) ===
    {
      const checks = [
        (Object.keys(ROLE_PERMISSIONS) as MemberRole[]).length === 6,
        hasGrant("OWNER", "org", "delete"),
        hasGrant("OWNER", "members", "create"),
        !hasGrant("ADMIN", "org", "delete"),
        hasGrant("ADMIN", "members", "create"),
        hasGrant("MEMBER", "blocks_data", "create"),
        !hasGrant("MEMBER", "members", "create"),
      ];
      const ok = checks.every(Boolean);
      results.push({ name: "A) RBAC matrix integrity", ok, detail: "OWNER⊃ADMIN⊃MEMBER grants consistent", error: ok ? undefined : "Matrix diverged" });
    }

    // === B) Tenant isolation (#143/#144): can() + assertMemberBelongsToOrg ===
    {
      const orgA = await prisma.organization.create({ data: { slug: `${tag}-a`, subdomain: `${tag}-a`, name: "Smoke A" }, select: { id: true } });
      const orgB = await prisma.organization.create({ data: { slug: `${tag}-b`, subdomain: `${tag}-b`, name: "Smoke B" }, select: { id: true } });
      createdOrgIds.push(orgA.id, orgB.id);
      const pA = await seedProfile("memberA");
      const pB = await seedProfile("memberB");
      await seedMember(orgA.id, pA, "MEMBER");
      const memberB_id = await seedMember(orgB.id, pB, "MEMBER");

      const perm: Permission = { resource: "blocks_data", action: "create" };
      const memberActor = actorFor([{ organizationId: orgA.id, status: "ACTIVE", roles: [{ role: "MEMBER", scopeType: "ORG", scopeId: null }] }]);
      const nonMemberActor = actorFor([]); // belongs to no org
      const superActor = actorFor([], true);

      const memberAllowed = await can(memberActor, perm, orgA.id);
      const nonMemberDenied = !(await can(nonMemberActor, perm, orgA.id));
      const superBypass = await can(superActor, perm, orgA.id);
      const crossOrg = await assertMemberBelongsToOrg(memberB_id, orgA.id); // must be null

      const ok = memberAllowed && nonMemberDenied && superBypass && crossOrg === null;
      results.push({
        name: "B) Tenant isolation (can + cross-org)",
        ok,
        detail: `member=allow(${memberAllowed}) nonMember=deny(${nonMemberDenied}) super=bypass(${superBypass}) crossOrg=null(${crossOrg === null})`,
        error: ok ? undefined : "isolation invariant broke",
      });
    }

    // === C) Domain routing: resolveOrgByHost (subdomain + customDomain + unknown) ===
    {
      const sub = `${tag}-c`;
      const customDomain = `${tag}.example.com`;
      const orgC = await prisma.organization.create({
        data: { slug: sub, subdomain: sub, customDomain, name: "Smoke C" },
        select: { id: true },
      });
      createdOrgIds.push(orgC.id);
      _resetOrgResolverCache();

      const bySub = await resolveOrgByHost(`${sub}.${APEX}`);
      const byCustom = await resolveOrgByHost(customDomain);
      const unknown = await resolveOrgByHost(`${tag}-none.${APEX}`);

      const ok = bySub === orgC.id && byCustom === orgC.id && unknown === null;
      results.push({
        name: "C) Domain routing (resolveOrgByHost)",
        ok,
        detail: `subdomain=${bySub === orgC.id} customDomain=${byCustom === orgC.id} unknown=null(${unknown === null})`,
        error: ok ? undefined : "host→org resolution broke",
      });
    }

    // === D) Invite accept e2e (createInvitation → acceptInvitation → membership) ===
    {
      const orgD = await prisma.organization.create({ data: { slug: `${tag}-d`, subdomain: `${tag}-d`, name: "Smoke D" }, select: { id: true } });
      createdOrgIds.push(orgD.id);
      const inviter = await seedProfile("inviter");
      const inviteeEmail = `${tag}-invitee@example.com`;

      const inv = await createInvitation({ organizationId: orgD.id, email: inviteeEmail, role: "MEMBER", createdById: inviter });
      // New invitee account → acceptInvitation requires a password to create it.
      const accepted = await acceptInvitation({ token: inv.token, password: `Smoke-${tag}-pw1` });
      // acceptInvitation creates/uses a NetworkProfile for the invitee — track for teardown.
      createdProfileIds.push(accepted.profile.id);

      const membership = await prisma.organizationMember.findFirst({
        where: { organizationId: orgD.id, networkProfileId: accepted.profile.id, status: "ACTIVE" },
        select: { id: true, roles: { select: { role: true } } },
      });
      const ok = !!membership && membership.roles.some((r) => r.role === "MEMBER");
      results.push({
        name: "D) Invite accept e2e",
        ok,
        detail: `token issued → accepted → ACTIVE MEMBER membership (${!!membership})`,
        error: ok ? undefined : "invite→accept did not create the expected membership",
      });
    }
  } finally {
    // Teardown — orgs cascade (members, roles, invitations); profiles by id + by tag.
    if (createdOrgIds.length) await prisma.organization.deleteMany({ where: { id: { in: createdOrgIds } } });
    if (createdProfileIds.length) await prisma.networkProfile.deleteMany({ where: { id: { in: createdProfileIds } } });
    // Belt-and-suspenders: anything with this run's tag (e.g. an accept-created profile we missed).
    await prisma.networkProfile.deleteMany({ where: { email: { startsWith: tag } } });

    // Verify zero residue.
    const orgResidue = await prisma.organization.count({ where: { slug: { startsWith: tag } } });
    const profileResidue = await prisma.networkProfile.count({ where: { email: { startsWith: tag } } });
    results.push({
      name: "Teardown — zero residue",
      ok: orgResidue === 0 && profileResidue === 0,
      detail: `orgs left=${orgResidue} profiles left=${profileResidue}`,
      error: orgResidue === 0 && profileResidue === 0 ? undefined : "TEARDOWN LEFT RESIDUE",
    });
  }

  // === Summary ===
  log("");
  log("=== FASE 4 SMOKE RESULTS ===");
  let failCount = 0;
  results.forEach((r) => {
    log(`${r.ok ? "✓" : "✗"} ${r.name}`);
    if (r.detail) log(`   ${r.detail}`);
    if (r.error) log(`   ERROR: ${r.error}`);
    if (!r.ok) failCount++;
  });
  log("");
  log(`Total: ${results.length - failCount} passed, ${failCount} failed`);

  await prisma.$disconnect();

  if (failCount > 0) process.exit(1);
  log("✓✓✓ ALL CHECKS PASSED — Fase 4 smoke validated ✓✓✓");
  process.exit(0);
}

main().catch((err) => {
  console.error("[smoke:fase4] FATAL:", err);
  process.exit(1);
});
