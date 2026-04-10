import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return apiError("Unauthorized", 401);

    const { type, id } = await params;

    let data: Record<string, unknown> | null = null;

    switch (type) {
      case "product": {
        const product = await prisma.product.findUnique({
          where: { id },
          include: {
            images: { select: { id: true, url: true, alt: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
          },
        });
        if (product) {
          data = {
            ...product,
            retailPrice: product.retailPrice ? Number(product.retailPrice) : null,
            memberPrice: product.memberPrice ? Number(product.memberPrice) : null,
            costOfGoods: product.costOfGoods ? Number(product.costOfGoods) : null,
          };
        }
        break;
      }

      case "agent": {
        const agent = await prisma.agent.findUnique({
          where: { id },
          include: {
            skills: { select: { id: true, name: true, description: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
            tools: { select: { id: true, name: true, description: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
            tierAccess: { select: { id: true, subscriptionTierId: true, isEnabled: true, dailyUsageLimitOverride: true, priorityAccess: true, tier: { select: { name: true } } } },
          },
        });
        data = agent as unknown as Record<string, unknown>;
        break;
      }

      case "partner_brand": {
        const partner = await prisma.partnerBrand.findUnique({
          where: { id },
          include: {
            tierAssignments: { select: { id: true, subscriptionTierId: true, discountPercent: true, isActive: true, tier: { select: { name: true } } } },
          },
        });
        if (partner) {
          data = {
            ...partner,
            commissionRate: partner.commissionRate ? Number(partner.commissionRate) : null,
            kickbackValue: partner.kickbackValue ? Number(partner.kickbackValue) : null,
          };
        }
        break;
      }

      case "perk": {
        const perk = await prisma.perk.findUnique({
          where: { id },
          include: {
            tierAssignments: { select: { id: true, subscriptionTierId: true, isEnabled: true, configValue: true, tier: { select: { name: true } } } },
          },
        });
        data = perk as unknown as Record<string, unknown>;
        break;
      }

      case "community_benefit": {
        const benefit = await prisma.communityBenefit.findUnique({
          where: { id },
          include: {
            tierAssignments: { select: { id: true, subscriptionTierId: true, isEnabled: true, tier: { select: { name: true } } } },
          },
        });
        data = benefit as unknown as Record<string, unknown>;
        break;
      }

      // Knowledge types — return the base record metadata (no full textContent)
      case "document": {
        const doc = await prisma.knowledgeDocument.findUnique({ where: { id } });
        data = doc as unknown as Record<string, unknown>;
        break;
      }
      case "image": {
        const img = await prisma.knowledgeImage.findUnique({ where: { id } });
        data = img as unknown as Record<string, unknown>;
        break;
      }
      case "video": {
        const vid = await prisma.knowledgeVideo.findUnique({ where: { id } });
        data = vid as unknown as Record<string, unknown>;
        break;
      }
      case "audio": {
        const aud = await prisma.knowledgeAudio.findUnique({ where: { id } });
        data = aud as unknown as Record<string, unknown>;
        break;
      }
      case "link": {
        const link = await prisma.knowledgeLink.findUnique({ where: { id } });
        data = link as unknown as Record<string, unknown>;
        break;
      }
      case "table": {
        const tbl = await prisma.knowledgeTable.findUnique({ where: { id } });
        data = tbl as unknown as Record<string, unknown>;
        break;
      }
      case "form": {
        const form = await prisma.knowledgeForm.findUnique({ where: { id } });
        data = form as unknown as Record<string, unknown>;
        break;
      }
      case "rss": {
        const rss = await prisma.knowledgeRSSFeed.findUnique({ where: { id } });
        data = rss as unknown as Record<string, unknown>;
        break;
      }
      case "app_data": {
        const app = await prisma.knowledgeApp.findUnique({ where: { id } });
        data = app as unknown as Record<string, unknown>;
        break;
      }

      default:
        return apiError("Unknown artifact type", 400);
    }

    if (!data) return apiError("Artifact not found", 404);

    return apiSuccess({ data });
  } catch (e) {
    console.error("GET /api/chat/artifacts/[type]/[id] error:", e);
    return apiError("Failed to load artifact", 500);
  }
}
