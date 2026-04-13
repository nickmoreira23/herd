import Anthropic from "@anthropic-ai/sdk";
import { apiError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import type { FinancialInputs } from "@/lib/financial-engine";
import { resolveAnthropicKey } from "@/lib/integrations";

const SYSTEM_PROMPT = `You are a financial modeling assistant for HERD OS, a subscription box company. You modify financial model inputs based on natural language instructions.

You will receive the current financial model inputs as JSON and a user prompt describing desired changes. Return ONLY valid JSON matching the exact same schema — no explanation, no markdown fences, just raw JSON.

The schema for FinancialInputs is:
{
  "tiers": [
    {
      "tierId": string,
      "monthlyPrice": number,
      "quarterlyPricePerMonth": number,
      "annualPricePerMonth": number,
      "monthlyCredits": number,
      "apparelCOGSPerMonth": number,
      "subscriberPercent": number (0-100, all tiers must sum to 100),
      "churnRateMonthly": number (0-100),
      "minimumCommitMonths": number (minimum contract months before subscriber can cancel, default 1)
    }
  ],
  "billingCycleDistribution": {
    "monthly": number (0-100),
    "quarterly": number (0-100),
    "annual": number (0-100)
    // must sum to 100
  },
  "creditRedemptionRate": number (0.0-1.0),
  "avgCOGSToMemberPriceRatio": number (typically 0.15-0.30),
  "breakageRate": number (0.0-1.0),
  "fulfillmentCostPerOrder": number,
  "shippingCostPerOrder": number,
  "commissionStructure": {
    "flatBonusPerSale": number,
    "residualPercent": number (0-100),
    "residualDelayMonths": number (0-12, months after sale before residual starts, default 0),
    "tierBonuses": [{ "tierId": string, "flatBonus": number }],
    "percentHittingAccelerator": number (0-100),
    "acceleratorMultiplier": number
  },
  "salesRepChannel": {
    "startingReps": number,
    "salesPerRepPerMonth": number,
    "monthlyGrowthRate": number (0-100, e.g. 10 = 10% monthly growth)
  },
  "chargebackPercent": number (0-100, percentage of new subscribers that chargeback, default 0),
  "chargebackFee": number ($ fee per chargeback incident, typically 15-25, default 15),
  "partnerKickbacks": [
    {
      "partnerId": string,
      "estimatedMonthlyReferrals": number,
      "kickbackType": string,
      "kickbackValue": number
    }
  ],
  "operationalOverhead": {
    "mode": "fixed" | "milestone-scaled",
    "fixedMonthly": number,
    "opexData": optional (do not modify — this is loaded from the Operations page)
  },
  "profitSplitParties": [
    {
      "id": string (uuid),
      "name": string (party name, e.g. "HERD", "Partner A"),
      "percent": number (0-100, all parties should ideally sum to 100)
    }
  ]
}

Rules:
- Only modify fields the user explicitly or implicitly asks to change.
- Keep tier IDs, partner IDs, and structure intact unless the user asks to add/remove them.
- Ensure subscriberPercent across all tiers sums to 100.
- Ensure billingCycleDistribution sums to 100.
- All percentage fields that are 0-100 should stay in that range (not 0.0-1.0).
- creditRedemptionRate, avgCOGSToMemberPriceRatio, and breakageRate are 0.0-1.0 decimals.
- For operationalOverhead: you may change mode and fixedMonthly, but NEVER modify opexData (it's managed by the Operations page).
- For profitSplitParties: each party has a unique "id" (UUID string), a "name", and a "percent" (0-100). All parties' percents should ideally sum to 100. Preserve existing party IDs when modifying.
- residualDelayMonths (in commissionStructure): integer 0-12, represents months after a sale before the rep starts earning residual commissions. 0 means residual starts immediately.
- minimumCommitMonths (per tier): integer 1-24, represents the minimum contract period before subscribers can cancel. Churn only starts after this period expires.
- chargebackPercent: 0-100, percentage of new subscribers that will chargeback. Chargebacks reduce net new subscribers and incur costs.
- chargebackFee: $ per chargeback incident (processor fee).
- The samplerChannel field is DEPRECATED. Always set it to { monthlyMarketingSpend: 0, costPerSampler: 0, conversionRate: 0, monthlyGrowthRate: 0 } or omit it.
- Return the complete FinancialInputs object, not a partial one.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentInputs, prompt } = body as {
      currentInputs: FinancialInputs;
      prompt: string;
    };

    if (!prompt?.trim()) {
      return apiError("Prompt is required", 400);
    }

    if (!currentInputs) {
      return apiError("Current inputs are required", 400);
    }

    let anthropic: Anthropic;
    try {
      const apiKey = await resolveAnthropicKey();
      anthropic = new Anthropic({ apiKey });
    } catch (err) {
      return apiError(err instanceof Error ? err.message : "API key not configured", 500);
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Current financial model inputs:\n\`\`\`json\n${JSON.stringify(currentInputs, null, 2)}\n\`\`\`\n\nUser request: ${prompt}\n\nReturn the modified FinancialInputs as raw JSON only.`,
        },
      ],
    });

    // Extract text from the response
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return apiError("No response from AI", 500);
    }

    // Parse the JSON — strip any markdown fences if present
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let newInputs: FinancialInputs;
    try {
      newInputs = JSON.parse(jsonStr) as FinancialInputs;
    } catch {
      console.error("Failed to parse AI response:", jsonStr.slice(0, 500));
      return apiError("AI returned invalid JSON. Please try again.", 500);
    }

    // Basic validation: ensure required top-level fields exist
    if (!newInputs.tiers || !newInputs.salesRepChannel) {
      return apiError("AI returned incomplete inputs. Please try again.", 500);
    }

    return NextResponse.json({ inputs: newInputs });
  } catch (e) {
    console.error("POST /api/financials/remix error:", e);
    return apiError("Remix failed — please try again", 500);
  }
}
