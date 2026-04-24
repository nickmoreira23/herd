import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-utils";
import { aiSuggestSchema } from "@/lib/validators/package";
import { computeCreditCost, resolveDiscount, type RedemptionRule } from "@/lib/credit-cost";
import { resolveAnthropicKey } from "@/lib/integrations";

const FITNESS_GOAL_SPECIALIST_PROMPT = `You are an expert fitness and nutrition specialist. Your job is to recommend TYPES of products (not specific products) that would best support a person's fitness goal.

The user has specified their preferred budget allocation between supplements, apparel, and accessories. You MUST respect these preferences when allocating budget percentages.

CRITICAL RULE: You MUST allocate at least 80% of the total budget. budgetPercent values MUST sum to at least 80.

Strategy:
1. FIRST, recommend the essential supplements for the fitness goal (these are highest priority)
2. THEN, fill any remaining budget with apparel and accessories according to the user's preference ratio
3. Respect the user's category preferences — if they want 70% supplements, aim for ~70% supplement budget

Consider:
- Nutritional priorities for the specific fitness goal
- What supplements are most impactful for results
- Budget allocation respecting the user's category preferences
- Include apparel/accessory recommendations to fill the budget

Respond ONLY with valid JSON in this exact format:
{
  "recommendations": [
    {
      "type": "string — product type/category (e.g., 'Whey Protein', 'Pre-Workout', 'Performance Tee')",
      "category": "SUPPLEMENT | APPAREL | ACCESSORY",
      "priority": "high | medium | low",
      "budgetPercent": number (0-100, all MUST sum to at least 80),
      "reasoning": "string — brief explanation of why this is important for the goal"
    }
  ]
}`;

const PRODUCT_SPECIALIST_PROMPT = `You are a product catalog specialist. Given product type recommendations from a fitness expert, the user's category preferences, and the available product catalog, select the specific products that best match each recommendation within the budget.

CRITICAL RULES:
1. NEVER exceed the monthly credit budget. This is an absolute hard limit.
2. Use AT LEAST 80% of the monthly credit budget — fill the budget greedily.
3. Prioritize high-priority recommendations first, then medium, then low.
4. Each tier has a DIFFERENT budget — select MORE products for higher budgets and FEWER for lower budgets.
5. Do NOT repeat the same product set across tiers. Higher tiers get more products and/or higher quantities.
6. Only select from the provided catalog — do NOT invent products.
7. Default to quantity 1 unless the budget allows more of the same product.

Budget strategy:
- Start with high-priority items
- Add medium and low priority items to fill budget
- If budget remains, add quantity 2+ of key items or pick additional catalog items
- Stop before exceeding the budget

Respond ONLY with valid JSON in this exact format:
{
  "suggestions": [
    {
      "productId": "string — exact product ID from catalog",
      "productName": "string — product name for display",
      "quantity": number,
      "creditCost": number (per unit, from catalog),
      "totalCost": number (creditCost * quantity),
      "reasoning": "string — why this product fits the recommendation",
      "matchedType": "string — which recommendation type this fulfills"
    }
  ]
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }

  const parsed = aiSuggestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", 400, parsed.error.issues);
  }

  const { fitnessGoal, customGoalDescription, mode, preferences, recommendations: inputRecommendations, feedback, previousRecommendations } = parsed.data;
  const subscriptionTierId = parsed.data.subscriptionTierId;

  const goalLabel = fitnessGoal === "CUSTOM" && customGoalDescription
    ? `Custom goal: ${customGoalDescription}`
    : fitnessGoal.replace(/_/g, " ").toLowerCase();
  const prefLabel = preferences
    ? `Supplements: ${preferences.supplements}%, Apparel: ${preferences.apparel}%, Accessories: ${preferences.accessories}%`
    : "Supplements: 60%, Apparel: 25%, Accessories: 15%";

  // ── Analysis mode: only run fitness specialist ──
  if (mode === "analysis") {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(event: string, data: unknown) {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        }

        try {
          const isRefinement = feedback && previousRecommendations && previousRecommendations.length > 0;

          send("status", {
            message: isRefinement
              ? "Refining recommendations based on your feedback..."
              : "Analyzing your fitness goal and category preferences...",
          });

          const baseUserMessage = `Fitness goal: ${goalLabel}\nUser's category budget preferences: ${prefLabel}\nAvailable product categories: SUPPLEMENT (Pre-Workout, Protein, Amino, Vitamin, Health, Recovery), APPAREL (Tee, Hoodie, Shorts, Hat), ACCESSORY (Shaker, Bag, Gear)\n\nPlease recommend the ideal product types for this goal, respecting the user's category preferences.`;

          const messages: Anthropic.MessageParam[] = isRefinement
            ? [
                { role: "user", content: baseUserMessage },
                {
                  role: "assistant",
                  content: JSON.stringify({ recommendations: previousRecommendations }),
                },
                {
                  role: "user",
                  content: `The user reviewed your recommendations and has the following feedback:\n\n"${feedback}"\n\nPlease provide an updated set of recommendations that addresses this feedback. Keep the same JSON format. budgetPercent values MUST still sum to at least 80. Respect the original fitness goal and category preferences while incorporating the user's feedback.`,
                },
              ]
            : [{ role: "user", content: baseUserMessage }];

          const agent1Response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: FITNESS_GOAL_SPECIALIST_PROMPT,
            messages,
          });

          const agent1Text =
            agent1Response.content[0].type === "text"
              ? agent1Response.content[0].text
              : "";

          let recommendations;
          try {
            recommendations = JSON.parse(agent1Text);
          } catch {
            const jsonMatch = agent1Text.match(/```(?:json)?\s*([\s\S]*?)```/);
            recommendations = jsonMatch
              ? JSON.parse(jsonMatch[1])
              : { recommendations: [] };
          }

          send("recommendations", recommendations);
          send("done", { success: true });
        } catch (err) {
          console.error("AI analysis error:", err);
          send("error", {
            message: err instanceof Error ? err.message : "AI analysis failed",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // ── Products mode: only run product specialist ──
  if (!subscriptionTierId) {
    return apiError("subscriptionTierId is required for products mode", 400);
  }

  // Fetch tier with redemption rules
  const tier = await prisma.subscriptionTier.findUnique({
    where: { id: subscriptionTierId },
    include: { redemptionRules: true },
  });
  if (!tier) return apiError("Tier not found", 404);

  // Fetch the variant to see what products are already selected
  const variant = await prisma.packageTierVariant.findUnique({
    where: {
      packageId_subscriptionTierId: {
        packageId,
        subscriptionTierId,
      },
    },
    include: {
      products: { select: { productId: true } },
    },
  });

  const existingProductIds = new Set(
    variant?.products.map((p) => p.productId) ?? []
  );

  // Fetch all active products with credit costs
  const allProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      subCategory: true,
      retailPrice: true,
      memberPrice: true,
      costOfGoods: true,
      shippingCost: true,
      handlingCost: true,
      paymentProcessingPct: true,
      paymentProcessingFlat: true,
      description: true,
      brand: true,
      imageUrl: true,
    },
  });

  const rules: RedemptionRule[] = tier.redemptionRules.map((r) => ({
    redemptionType: r.redemptionType,
    scopeType: r.scopeType,
    scopeValue: r.scopeValue,
    discountPercent: r.discountPercent,
  }));

  const catalog = allProducts
    .filter((p) => !existingProductIds.has(p.id))
    .map((p) => {
      const memberPrice = Number(p.memberPrice);
      const pricing = {
        sku: p.sku,
        category: p.category,
        subCategory: p.subCategory,
        memberPrice,
      };
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        subCategory: p.subCategory,
        brand: p.brand,
        description: p.description?.slice(0, 200),
        memberPrice,
        retailPrice: Number(p.retailPrice),
        costOfGoods: Number(p.costOfGoods),
        shippingCost: Number(p.shippingCost),
        handlingCost: Number(p.handlingCost),
        paymentProcessingPct: Number(p.paymentProcessingPct),
        paymentProcessingFlat: Number(p.paymentProcessingFlat),
        discountPercent: resolveDiscount(pricing, rules),
        creditCost: computeCreditCost(pricing, rules),
        imageUrl: p.imageUrl,
      };
    });

  const monthlyBudget = Number(tier.monthlyCredits);
  const currentSpend = variant ? Number(variant.totalCreditsUsed) : 0;
  const remainingBudget = monthlyBudget - currentSpend;

  // Fetch all tiers for this package to provide tier positioning context
  const allVariants = await prisma.packageTierVariant.findMany({
    where: { packageId },
    include: {
      subscriptionTier: {
        select: { id: true, name: true, monthlyCredits: true, sortOrder: true },
      },
    },
    orderBy: { subscriptionTier: { sortOrder: "asc" } },
  });
  const sortedTiers = allVariants.map((v) => v.subscriptionTier);
  const tierIndex = sortedTiers.findIndex((t) => t.id === subscriptionTierId);
  const tierPosition = tierIndex + 1;
  const totalTiers = sortedTiers.length;
  const tierLineup = sortedTiers
    .map((t, i) => `${i + 1}. ${t.name} ($${Number(t.monthlyCredits).toFixed(0)} credits)`)
    .join(", ");

  // Use provided recommendations or empty
  const recsForAgent = inputRecommendations ?? [];

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        send("status", { message: "Matching products from catalog..." });

        const agent2Response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: PRODUCT_SPECIALIST_PROMPT,
          messages: [
            {
              role: "user",
              content: `Fitness goal: ${goalLabel}\nTier: "${tier.name}" — tier ${tierPosition} of ${totalTiers} (${tierLineup})\nRemaining monthly credit budget: $${remainingBudget.toFixed(2)}\nMINIMUM spend target (80%): $${(remainingBudget * 0.8).toFixed(2)}\nMAXIMUM (NEVER exceed): $${remainingBudget.toFixed(2)}\nUser's category preferences: ${prefLabel}\n\nTIER POSITIONING: This is the "${tier.name}" tier (${tierPosition}/${totalTiers}). ${tierPosition === 1 ? "As the entry-level tier, focus on the most essential products only." : tierPosition === totalTiers ? "As the premium tier, include a comprehensive selection with premium and variety products." : tierPosition <= totalTiers / 2 ? "As a mid-low tier, include essentials plus a few additional products." : "As a mid-high tier, include a broad selection with some premium products."} Each tier MUST have a DIFFERENT product selection — do NOT just copy a smaller tier's products. Higher tiers should include MORE products and/or HIGHER quantities, not the same products.\n\nYou MUST select products totaling at least $${(remainingBudget * 0.8).toFixed(2)} but NEVER more than $${remainingBudget.toFixed(2)}. Going over $${remainingBudget.toFixed(2)} is STRICTLY PROHIBITED.\n${feedback ? `\nUSER INSTRUCTIONS (highest priority — follow these exactly): ${feedback}\n` : ""}Fitness specialist recommendations:\n${JSON.stringify(recsForAgent, null, 2)}\n\nAvailable product catalog (${catalog.length} products):\n${JSON.stringify(catalog.map(({ imageUrl, ...rest }) => rest), null, 2)}\n\nPlease select the best specific products from this catalog. Ensure the selection is appropriate for the "${tier.name}" tier level.`,
            },
          ],
        });

        const agent2Text =
          agent2Response.content[0].type === "text"
            ? agent2Response.content[0].text
            : "";

        let suggestions;
        try {
          suggestions = JSON.parse(agent2Text);
        } catch {
          const jsonMatch = agent2Text.match(/```(?:json)?\s*([\s\S]*?)```/);
          suggestions = jsonMatch
            ? JSON.parse(jsonMatch[1])
            : { suggestions: [] };
        }

        // Enrich suggestions with memberPrice, discountPercent, and imageUrl from catalog
        // Also enforce budget: use catalog prices (not AI-claimed prices) and trim to fit
        const catalogMap = new Map(catalog.map((c) => [c.id, c]));
        let runningTotal = 0;
        const enrichedList: unknown[] = [];
        for (const s of (suggestions.suggestions || []) as { productId: string; quantity: number; [key: string]: unknown }[]) {
          const cat = catalogMap.get(s.productId);
          if (!cat) continue; // product not in catalog — skip

          const trueCreditCost = cat.creditCost;
          const qty = Math.max(1, Math.round(Number(s.quantity) || 1));
          const trueTotalCost = trueCreditCost * qty;

          // Only include if it fits within the remaining budget
          if (runningTotal + trueTotalCost > remainingBudget) continue;

          runningTotal += trueTotalCost;
          enrichedList.push({
            ...s,
            quantity: qty,
            creditCost: trueCreditCost,
            totalCost: trueTotalCost,
            memberPrice: cat.memberPrice,
            retailPrice: cat.retailPrice,
            discountPercent: cat.discountPercent,
            imageUrl: cat.imageUrl,
            category: cat.category,
            sku: cat.sku,
            subCategory: cat.subCategory,
            costOfGoods: cat.costOfGoods,
            shippingCost: cat.shippingCost,
            handlingCost: cat.handlingCost,
            paymentProcessingPct: cat.paymentProcessingPct,
            paymentProcessingFlat: cat.paymentProcessingFlat,
          });
        }
        const enrichedSuggestions = { suggestions: enrichedList };

        send("suggestions", enrichedSuggestions);
        send("done", { success: true });
      } catch (err) {
        console.error("AI suggest error:", err);
        send("error", {
          message: err instanceof Error ? err.message : "AI suggestion failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
