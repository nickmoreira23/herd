import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateContactSchema } from "@/lib/validators/contacts";
import { dispatchBlockEvent } from "@/lib/routines/dispatcher";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) return apiError("Contact not found", 404);
    return apiSuccess(contact);
  } catch (e) {
    console.error("GET /api/contacts/[id] error:", e);
    return apiError("Failed to fetch contact", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateContactSchema);
  if ("error" in result) return result.error;

  try {
    const body = result.data;
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) return apiError("Contact not found", 404);

    const data: Prisma.ContactUpdateInput = {};
    const stringFields: (keyof typeof body)[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "avatarUrl",
      "jobTitle",
      "department",
      "source",
      "street",
      "street2",
      "city",
      "state",
      "zip",
      "country",
      "linkedinUrl",
      "twitterHandle",
    ];
    for (const f of stringFields) {
      if (body[f] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data as any)[f] = body[f] ?? null;
      }
    }
    if (body.companyId !== undefined) data.companyId = body.companyId ?? null;
    if (body.ownerId !== undefined) data.ownerId = body.ownerId ?? null;
    if (body.birthday !== undefined)
      data.birthday = body.birthday ? new Date(body.birthday) : null;
    if (body.contentJson !== undefined)
      data.contentJson = body.contentJson as Prisma.InputJsonValue;
    if (body.contentText !== undefined) data.contentText = body.contentText;
    if (body.tags !== undefined) data.tags = body.tags;

    const contact = await prisma.contact.update({ where: { id }, data });
    void dispatchBlockEvent("contacts", "updated", {
      contactId: contact.id,
      firstName: contact.firstName,
      email: contact.email,
    });
    return apiSuccess(contact);
  } catch (e) {
    console.error("PATCH /api/contacts/[id] error:", e);
    return apiError("Failed to update contact", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.contact.delete({ where: { id } });
    void dispatchBlockEvent("contacts", "deleted", { contactId: id });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/contacts/[id] error:", e);
    return apiError("Failed to delete contact", 500);
  }
}
