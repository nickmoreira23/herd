import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { resolveAnthropicKey } from "@/lib/integration-keys";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

const IDENTITY_PROMPT = `You are a fitness brand copywriter. Given a fitness goal and optional product summary, generate a compelling package name and description for a subscription product bundle.

Rules:
- The name should be 2-4 words, catchy and goal-specific (e.g., "Lean Machine Bundle", "Peak Power Pack")
- The description should be 1-2 sentences explaining who it's for and what value it provides
- Keep the tone professional but energetic
- Do NOT use generic names like "Weight Loss Package"

Respond ONLY with valid JSON:
{
  "name": "string",
  "description": "string"
}`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: packageId } = await params;

  let anthropic: Anthropic;
  try {
    const apiKey = await resolveAnthropicKey();
    anthropic = new Anthropic({ apiKey });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "API key not configured", 500);
  }

  let body: { fitnessGoal: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }

  if (!body.fitnessGoal) {
    return apiError("fitnessGoal is required", 400);
  }

  // Optionally fetch product summary for context. L1a.4 — Product is
  // tenant-scoped, so the names come from a direct read under the host org
  // (nested include would run without the GUC and be denied by RLS). The
  // summary is best-effort: no org → no summary.
  let productSummary = "";
  try {
    const orgId = await getOrgIdFromRequest();
    const variants = await prisma.packageTierVariant.findMany({
      where: { packageId },
      include: {
        products: true,
      },
    });

    const productIds = variants.flatMap((v) => v.products.map((p) => p.productId));
    const catalogProducts =
      orgId && productIds.length > 0
        ? await withTenant(orgId, () =>
            prisma.product.findMany({
              where: { id: { in: productIds } },
              select: { id: true, name: true },
            })
          )
        : [];
    const productById = new Map(catalogProducts.map((p) => [p.id, p]));

    // L1b.2a — Tier joined in memory under the host org (Package family is not tenant-scoped).
    const tierIds = variants.map((v) => v.subscriptionTierId);
    const tiers =
      orgId && tierIds.length > 0
        ? await withTenant(orgId, () =>
            prisma.subscriptionTier.findMany({
              where: { id: { in: tierIds } },
              select: { id: true, name: true },
            })
          )
        : [];
    const tierById = new Map(tiers.map((t) => [t.id, t]));

    const tierSummaries = variants
      .map((v) => {
        const subscriptionTier = tierById.get(v.subscriptionTierId);
        if (!subscriptionTier) return "";
        const productNames = v.products
          .flatMap((p) => {
            const product = productById.get(p.productId);
            return product ? [product.name] : [];
          })
          .join(", ");
        return productNames ? `${subscriptionTier.name}: ${productNames}` : "";
      })
      .filter(Boolean);

    if (tierSummaries.length > 0) {
      productSummary = `\nProducts by tier:\n${tierSummaries.join("\n")}`;
    }
  } catch {
    // Continue without product summary
  }

  const goalLabel = body.fitnessGoal.replace(/_/g, " ").toLowerCase();

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: IDENTITY_PROMPT,
      messages: [
        {
          role: "user",
          content: `Fitness goal: ${goalLabel}${productSummary}\n\nGenerate a name and description for this package.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      result = jsonMatch ? JSON.parse(jsonMatch[1]) : { name: "", description: "" };
    }

    return apiSuccess({
      name: result.name || "",
      description: result.description || "",
    });
  } catch (err) {
    console.error("AI identity error:", err);
    return apiError("Failed to generate identity", 500);
  }
}
