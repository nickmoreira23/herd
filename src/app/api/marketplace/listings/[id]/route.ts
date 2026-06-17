import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
import { updateListingSchema } from "@/lib/validators/listing";
import { resolveListing } from "@/lib/marketplace/listing-resolver";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("Listing not found", 404);
  return withTenant(orgId, async () => {
    try {
      const { id } = await params;
      const listing = await prisma.listing.findUnique({ where: { id } });
      if (!listing) return apiError("Listing not found", 404);
      // Return the RESOLVED shape (block record + overrides; may be unavailable).
      const resolved = await resolveListing(listing);
      return apiSuccess({
        ...resolved,
        price: resolved.price
          ? { amountCents: resolved.price.amountCents.toString(), currency: resolved.price.currency }
          : null,
      });
    } catch (e) {
      console.error("GET /api/marketplace/listings/[id] error:", e);
      return apiError("Failed to load listing", 500);
    }
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Guard-rail #32 (V1): editing a listing (incl. price override) requires OWNER/ADMIN.
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  const { id } = await params;
  const result = await parseAndValidate(request, updateListingSchema);
  if ("error" in result) return result.error;
  const { priceOverrideCents, ...rest } = result.data;

  return withTenant(orgId, async () => {
    try {
      // The (blockName, sourceId) reference is immutable — only own-data updates.
      const listing = await prisma.listing.update({
        where: { id },
        data: {
          ...rest,
          ...(priceOverrideCents !== undefined && {
            priceOverrideCents: BigInt(priceOverrideCents),
          }),
        },
      });
      revalidatePath("/admin/marketplace");
      return apiSuccess({
        ...listing,
        priceOverrideCents:
          listing.priceOverrideCents !== null ? listing.priceOverrideCents.toString() : null,
      });
    } catch (e) {
      console.error("PATCH /api/marketplace/listings/[id] error:", e);
      return apiError("Failed to update listing", 500);
    }
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  return withTenant(orgId, async () => {
    try {
      const { id } = await params;
      await prisma.listing.delete({ where: { id } });
      revalidatePath("/admin/marketplace");
      return apiSuccess({ deleted: true });
    } catch (e) {
      console.error("DELETE /api/marketplace/listings/[id] error:", e);
      return apiError("Failed to delete listing", 500);
    }
  });
}
