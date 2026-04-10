import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { resolveAnthropicKey } from "@/lib/integrations";

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

  // Optionally fetch product summary for context
  let productSummary = "";
  try {
    const variants = await prisma.packageTierVariant.findMany({
      where: { packageId },
      include: {
        products: {
          include: { product: { select: { name: true, category: true } } },
        },
        subscriptionTier: { select: { name: true } },
      },
    });

    const tierSummaries = variants
      .filter((v) => v.products.length > 0)
      .map((v) => {
        const productNames = v.products.map((p) => p.product.name).join(", ");
        return `${v.subscriptionTier.name}: ${productNames}`;
      });

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
