import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenancy/context";
import { withVerticalTenant } from "@/lib/org-hierarchy";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

/**
 * Sub-26.3 — escrita vertical (ADR-001 D4) integration gate.
 *
 * Tree: parent → child. Exercises the REAL path (withVerticalTenant + Extension
 * + RLS). #7 is the documental canary proving the RLS does NOT guard vertical
 * writes — the app-layer ancestry check is the entire boundary.
 */
const adminUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!adminUrl) throw new Error("DATABASE_URL required");
const admin = new PrismaClient({ adapter: new PrismaPg(adminUrl) });
const runtime = new PrismaClient({ adapter: new PrismaPg(runtimeUrl!) }); // no Extension

const P = `test-vwrite-${Date.now()}`;
let parent: { id: string };
let child: { id: string };
let actorProfile: { id: string };

beforeAll(async () => {
  parent = await admin.organization.create({
    data: { slug: `${P}-parent`, subdomain: `${P}-parent`, name: "VW Parent" },
    select: { id: true },
  });
  child = await admin.organization.create({
    data: { slug: `${P}-child`, subdomain: `${P}-child`, name: "VW Child", parentOrgId: parent.id },
    select: { id: true },
  });
  actorProfile = await admin.networkProfile.create({
    data: { firstName: "VW", lastName: "Parent", email: `${P}@example.com`, status: "ACTIVE" },
    select: { id: true },
  });
});

afterAll(async () => {
  await admin.auditLog.deleteMany({ where: { tenantId: { in: [parent.id, child.id] } } });
  await admin.department.deleteMany({ where: { name: { startsWith: P } } });
  await admin.organization.deleteMany({ where: { slug: { startsWith: P } } });
  await admin.networkProfile.deleteMany({ where: { email: `${P}@example.com` } });
  await admin.$disconnect();
  await runtime.$disconnect();
});

describe("vertical write (Sub-26.3 integration)", () => {
  it("#1 parent writes into child via authorized re-entry → row under tenant=child", async () => {
    const dept = await withVerticalTenant(parent.id, child.id, () =>
      prisma.department.create({
        data: { name: `${P}-vdept`, slug: "vdept", networkType: "INTERNAL" } as never,
      })
    );
    expect((dept as { tenantId: string }).tenantId).toBe(child.id);
  });

  it("#4 self exact write (normal withTenant) still works", async () => {
    const dept = await withTenant(parent.id, () =>
      prisma.department.create({
        data: { name: `${P}-selfdept`, slug: "selfdept", networkType: "INTERNAL" } as never,
      })
    );
    expect((dept as { tenantId: string }).tenantId).toBe(parent.id);
  });

  it("#5 audit cross-tier: actor=parent, tenant=child, via_parent_org present", async () => {
    await writeAuditLog({
      tenantId: child.id,
      actorProfileId: actorProfile.id,
      action: "department.created",
      resourceType: "department",
      resourceId: "vdept-id",
      metadata: { via_parent_org: parent.id },
    });
    const rows = await withTenant(child.id, () =>
      prisma.auditLog.findMany({ where: { tenantId: child.id, resourceId: "vdept-id" } })
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].actorProfileId).toBe(actorProfile.id);
    expect(rows[0].tenantId).toBe(child.id);
    expect((rows[0].metadata as { via_parent_org?: string }).via_parent_org).toBe(parent.id);
  });

  it("#7 CANARY (documental): the RLS does NOT block a write when the GUC is the target tenant", async () => {
    // A RLS NÃO protege a escrita vertical: com app.tenant_id setado para o
    // tenant-alvo, o WITH CHECK exato APROVA o write — sem qualquer checagem de
    // ancestralidade. assertCanOperateOnTenant (app-layer) é a fronteira de
    // segurança INTEIRA. NÃO remover a checagem confiando na RLS.
    const created = await runtime.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${child.id}, true)`;
      return tx.department.create({
        data: { tenantId: child.id, name: `${P}-canary`, slug: "vcanary", networkType: "INTERNAL" } as never,
      });
    });
    // It succeeded — the DB layer happily wrote to `child` because the GUC said so.
    expect((created as { tenantId: string }).tenantId).toBe(child.id);
  });
});
