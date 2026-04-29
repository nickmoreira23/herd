import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateCompanySchema } from "@/lib/validators/companies";
import { dispatchBlockEvent } from "@/lib/routines/dispatcher";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: { select: { contacts: true } },
        contacts: {
          select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true },
          orderBy: { firstName: "asc" },
          take: 50,
        },
      },
    });
    if (!company) return apiError("Company not found", 404);
    return apiSuccess(company);
  } catch (e) {
    console.error("GET /api/companies/[id] error:", e);
    return apiError("Failed to fetch company", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateCompanySchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) return apiError("Company not found", 404);

    const data: Prisma.CompanyUpdateInput = {};
    const stringFields = [
      "name",
      "legalName",
      "taxId",
      "website",
      "domain",
      "logoUrl",
      "industry",
      "email",
      "phone",
      "linkedinUrl",
      "twitterHandle",
      "street",
      "street2",
      "city",
      "state",
      "zip",
      "country",
      "description",
    ] as const;
    for (const f of stringFields) {
      if (body[f] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data as any)[f] = body[f] ?? null;
      }
    }
    if (body.size !== undefined) data.size = body.size ?? null;
    if (body.ownerId !== undefined) data.ownerId = body.ownerId ?? null;
    if (body.contentJson !== undefined)
      data.contentJson = body.contentJson as Prisma.InputJsonValue;
    if (body.contentText !== undefined) data.contentText = body.contentText;
    if (body.tags !== undefined) data.tags = body.tags;

    const company = await prisma.company.update({ where: { id }, data });
    void dispatchBlockEvent("companies", "updated", {
      companyId: company.id,
      name: company.name,
    });
    return apiSuccess(company);
  } catch (e) {
    console.error("PATCH /api/companies/[id] error:", e);
    return apiError("Failed to update company", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.company.delete({ where: { id } });
    void dispatchBlockEvent("companies", "deleted", { companyId: id });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/companies/[id] error:", e);
    return apiError("Failed to delete company", 500);
  }
}
