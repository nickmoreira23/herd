import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
import { blockRegistry } from "@/lib/blocks/registry";
import { createListingSchema } from "@/lib/validators/listing";
import { resolveBlockRecordMeta } from "@/lib/marketplace/listing-resolver";

export async function GET() {
  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiSuccess([]);
  return withTenant(orgId, async () => {
    try {
      const listings = await prisma.listing.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      return apiSuccess(listings);
    } catch (e) {
      console.error("GET /api/marketplace/listings error:", e);
      return apiError("Failed to list listings", 500);
    }
  });
}

export async function POST(request: NextRequest) {
  // Guard-rail #32 (V1): creating/pricing a listing requires OWNER/ADMIN.
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  const orgId = await getOrgIdFromRequest();
  if (!orgId) return apiError("No active organization", 400);

  const result = await parseAndValidate(request, createListingSchema);
  if ("error" in result) return result.error;
  const { sectionId, blockName, sourceId, priceOverrideCents, ...rest } = result.data;

  // blockName must be a known block.
  if (!blockRegistry.has(blockName)) {
    return apiError(`Unknown block: ${blockName}`, 400);
  }

  return withTenant(orgId, async () => {
    try {
      // L2b.2 — the owning section must exist in this org (tenant-scoped read).
      const section = await prisma.marketplaceSection.findUnique({ where: { id: sectionId } });
      if (!section) return apiError("Section not found", 404);

      // Soft ref validation: the referenced block record must resolve (no FK).
      const meta = await resolveBlockRecordMeta(blockName, sourceId);
      if (!meta) {
        return apiError(`No ${blockName} record found for sourceId "${sourceId}"`, 400);
      }

      const listing = await prisma.listing.create({
        data: {
          tenantId: orgId,
          sectionId,
          blockName,
          sourceId,
          priceOverrideCents:
            priceOverrideCents !== undefined ? BigInt(priceOverrideCents) : null,
          ...rest,
        },
      });

      revalidatePath("/admin/marketplace");
      return apiSuccess(serialize(listing), 201);
    } catch (e) {
      // Unique (tenantId, blockName, sourceId) collision → one listing per record.
      if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
        return apiError("A listing for this record already exists", 409);
      }
      console.error("POST /api/marketplace/listings error:", e);
      return apiError("Failed to create listing", 500);
    }
  });
}

/** BigInt is not JSON-serializable — emit cents as a string. */
function serialize(listing: { priceOverrideCents: bigint | null }) {
  return {
    ...listing,
    priceOverrideCents:
      listing.priceOverrideCents !== null ? listing.priceOverrideCents.toString() : null,
  };
}
