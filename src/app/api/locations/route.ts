import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createLocationSchema } from "@/lib/validators/locations";
import type { Prisma } from "@prisma/client";
import { requireOrgRole } from "@/lib/permissions";
import { withTenant } from "@/lib/tenancy/context";

export async function GET(request: Request) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN", "MEMBER"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get("type");
      const isActive = searchParams.get("isActive");
      const search = searchParams.get("search");
      const limit = parseInt(searchParams.get("limit") ?? "200", 10);
      const offset = parseInt(searchParams.get("offset") ?? "0", 10);

      const where: Prisma.LocationWhereInput = {};
      if (type) where.type = type;
      if (isActive === "true") where.isActive = true;
      else if (isActive === "false") where.isActive = false;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { state: { contains: search, mode: "insensitive" } },
          { country: { contains: search, mode: "insensitive" } },
          { street: { contains: search, mode: "insensitive" } },
        ];
      }

      const [locations, total] = await Promise.all([
        prisma.location.findMany({
          where,
          orderBy: [{ isHeadquarters: "desc" }, { name: "asc" }],
          take: limit,
          skip: offset,
        }),
        prisma.location.count({ where }),
      ]);

      return apiSuccess({ locations, total });
    } catch (e) {
      console.error("GET /api/locations error:", e);
      return apiError("Failed to fetch locations", 500);
    }
  });
}

export async function POST(request: Request) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const result = await parseAndValidate(request, createLocationSchema);
  if ("error" in result) return result.error;

  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      const body = result.data;

      if (body.isHeadquarters) {
        await prisma.location.updateMany({
          where: { isHeadquarters: true },
          data: { isHeadquarters: false },
        });
      }

      const location = await prisma.location.create({
        data: {
          tenantId: session.user.activeOrgId ?? "",
          name: body.name,
          type: body.type ?? "office",
          street: body.street ?? null,
          street2: body.street2 ?? null,
          city: body.city ?? null,
          state: body.state ?? null,
          zip: body.zip ?? null,
          country: body.country ?? null,
          phone: body.phone ?? null,
          email: body.email ?? null,
          isHeadquarters: body.isHeadquarters ?? false,
          notes: body.notes ?? null,
        },
      });

      return apiSuccess(location, 201);
    } catch (e) {
      console.error("POST /api/locations error:", e);
      return apiError("Failed to create location", 500);
    }
  });
}
