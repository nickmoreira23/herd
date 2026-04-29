import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createContactSchema } from "@/lib/validators/contacts";
import { dispatchBlockEvent } from "@/lib/routines/dispatcher";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const ownerId = searchParams.get("ownerId");
    const source = searchParams.get("source");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "200", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const where: Prisma.ContactWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (ownerId) where.ownerId = ownerId;
    if (source) where.source = source;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { jobTitle: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { contentText: { contains: search, mode: "insensitive" } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.contact.count({ where }),
    ]);

    return apiSuccess({ contacts, total });
  } catch (e) {
    console.error("GET /api/contacts error:", e);
    return apiError("Failed to fetch contacts", 500);
  }
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createContactSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const contact = await prisma.contact.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        avatarUrl: body.avatarUrl ?? null,
        jobTitle: body.jobTitle ?? null,
        department: body.department ?? null,
        companyId: body.companyId ?? null,
        ownerId: body.ownerId ?? null,
        source: body.source ?? null,
        street: body.street ?? null,
        street2: body.street2 ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        zip: body.zip ?? null,
        country: body.country ?? null,
        birthday: body.birthday ? new Date(body.birthday) : null,
        linkedinUrl: body.linkedinUrl ?? null,
        twitterHandle: body.twitterHandle ?? null,
        contentJson: (body.contentJson ?? {}) as Prisma.InputJsonValue,
        contentText: body.contentText ?? "",
        tags: body.tags ?? [],
      },
    });
    void dispatchBlockEvent("contacts", "created", {
      contactId: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      companyId: contact.companyId,
    });
    return apiSuccess(contact, 201);
  } catch (e) {
    console.error("POST /api/contacts error:", e);
    return apiError("Failed to create contact", 500);
  }
}
