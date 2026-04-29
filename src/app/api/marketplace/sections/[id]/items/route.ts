import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { getViewerContext } from "@/lib/marketplace/visibility-helpers";
import {
  resolveItemsPage,
  INITIAL_ITEMS_PAGE_SIZE,
  MAX_ITEMS_PAGE_SIZE,
} from "@/lib/marketplace/render-resolver";

/** Decode `?filters=` (URL-encoded JSON of `{ key: string[] }`). */
function parseFilters(raw: string | null): Record<string, string[]> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v)) out[k] = v.filter((x): x is string => typeof x === "string");
    }
    return out;
  } catch {
    return {};
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sp = request.nextUrl.searchParams;
    const blockName = sp.get("block");
    if (!blockName) return apiError("`block` is required", 400);
    const offset = Math.max(0, Number(sp.get("offset") ?? 0) || 0);
    const limitRaw = Number(sp.get("limit") ?? INITIAL_ITEMS_PAGE_SIZE);
    const limit = Math.min(
      MAX_ITEMS_PAGE_SIZE,
      Math.max(1, Number.isFinite(limitRaw) ? limitRaw : INITIAL_ITEMS_PAGE_SIZE)
    );
    const query = sp.get("q") ?? "";
    const filters = parseFilters(sp.get("filters"));

    const section = await prisma.marketplaceSection.findUnique({
      where: { id },
      include: { scopes: true },
    });
    if (!section) return apiError("Section not found", 404);

    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
    const viewer = await getViewerContext(userId);

    const page = await resolveItemsPage(section, blockName, viewer, {
      offset,
      limit,
      query,
      filters,
    });

    return apiSuccess(page);
  } catch (e) {
    console.error("GET /api/marketplace/sections/[id]/items error:", e);
    return apiError("Failed to load items page", 500);
  }
}
