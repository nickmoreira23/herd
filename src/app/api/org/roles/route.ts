import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { requireOrgRole, enforceRoute } from "@/lib/permissions";
import { withTenant } from "@/lib/tenancy/context";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

// Custom per-org role management (R&P Fase 5). PER-ORG only (no global templates).
// Reserved names that would shadow a system MemberRole — rejected on create/update.
const RESERVED = new Set([
  "owner", "admin", "member",
  "department_head", "department_manager", "department_member",
]);

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  key: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, "key must be kebab-case"),
  description: z.string().trim().max(1000).optional(),
});

/** GET /api/org/roles — list the org's custom roles. */
export async function GET() {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;
  const orgId = session.user.activeOrgId;
  if (!orgId) return apiError("No active organization", 400);

  const enforced = await enforceRoute(session, { resource: "roles", action: "read" }, {
    current: session, organizationId: orgId, routeId: "GET /api/org/roles",
  });
  if (enforced instanceof Response) return enforced;

  const roles = await withTenant(orgId, () =>
    prisma.role.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, key: true, description: true, createdAt: true,
        _count: { select: { membershipRoles: true, rolePermissions: true } } },
    })
  );
  return apiSuccess({ roles });
}

/** POST /api/org/roles — create a custom role (no grants yet; grant editing is Fase 6). */
export async function POST(request: Request) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;
  const orgId = session.user.activeOrgId;
  if (!orgId) return apiError("No active organization", 400);

  const enforced = await enforceRoute(session, { resource: "roles", action: "create" }, {
    current: session, organizationId: orgId, routeId: "POST /api/org/roles",
  });
  if (enforced instanceof Response) return enforced;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Invalid role", 400, parsed.error.flatten());
  const { name, key, description } = parsed.data;

  if (RESERVED.has(key.toLowerCase()) || RESERVED.has(name.toLowerCase())) {
    return apiError("Name/key collides with a system role", 422, undefined, "name_reserved");
  }

  const actorProfileId = (session.user as { id?: string }).id ?? null;

  return withTenant(orgId, async () => {
    let created;
    try {
      created = await prisma.role.create({
        data: { tenantId: orgId, name, key, description: description ?? null },
        select: { id: true, name: true, key: true, description: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return apiError("A role with this key already exists", 422, undefined, "key_duplicate");
      }
      throw e;
    }
    await writeAuditLog({
      tenantId: orgId, actorProfileId, action: "role.created",
      resourceType: "roles", resourceId: created.id, metadata: { name, key },
    });
    return apiSuccess(created, 201);
  });
}
