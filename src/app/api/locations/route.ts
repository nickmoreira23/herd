import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: [{ isHeadquarters: "desc" }, { name: "asc" }],
    });
    return apiSuccess(locations);
  } catch (e) {
    console.error("GET /api/locations error:", e);
    return apiError("Failed to fetch locations", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, street, street2, city, state, zip, country, phone, email, isHeadquarters, notes } = body;

    if (!name || typeof name !== "string") {
      return apiError("Name is required", 400);
    }

    // If marking as headquarters, unset any existing headquarters
    if (isHeadquarters) {
      await prisma.location.updateMany({
        where: { isHeadquarters: true },
        data: { isHeadquarters: false },
      });
    }

    const location = await prisma.location.create({
      data: {
        name,
        type: type || "office",
        street: street || null,
        street2: street2 || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        country: country || null,
        phone: phone || null,
        email: email || null,
        isHeadquarters: isHeadquarters || false,
        notes: notes || null,
      },
    });

    return apiSuccess(location);
  } catch (e) {
    console.error("POST /api/locations error:", e);
    return apiError("Failed to create location", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return apiError("Location ID is required", 400);
    }

    // If marking as headquarters, unset any existing headquarters
    if (data.isHeadquarters) {
      await prisma.location.updateMany({
        where: { isHeadquarters: true, id: { not: id } },
        data: { isHeadquarters: false },
      });
    }

    const location = await prisma.location.update({
      where: { id },
      data,
    });

    return apiSuccess(location);
  } catch (e) {
    console.error("PATCH /api/locations error:", e);
    return apiError("Failed to update location", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("Location ID is required", 400);
    }

    await prisma.location.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/locations error:", e);
    return apiError("Failed to delete location", 500);
  }
}
