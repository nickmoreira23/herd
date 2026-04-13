import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import type { SendFn } from "../runtime";

// ─── Tool Definitions ──────────────────────────────────────────

export const PLAN_AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_plans",
    description:
      "List all subscription plans with a summary of each (name, status, pricing, credits). Use this to understand the landscape before making changes.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_plan_details",
    description:
      "Get full configuration for a specific plan, including all fields (identity, pricing, credits, access, rules, cancellation) and benefit assignments (agents, partners, perks, community).",
    input_schema: {
      type: "object" as const,
      properties: {
        planId: { type: "string", description: "The UUID of the plan" },
      },
      required: ["planId"],
    },
  },
  {
    name: "update_plan_fields",
    description:
      "Update one or more fields on a subscription plan. Supports all plan configuration: identity (name, slug, tagline, description, colorAccent, iconUrl, highlightFeatures, status, visibility, isFeatured, sortOrder), pricing (monthlyPrice, quarterlyPrice, annualPrice, quarterlyDisplay, annualDisplay, setupFee, trialDays, billingAnchor), credits (monthlyCredits, creditExpirationDays, creditIssuing, rolloverMonths, rolloverCap, creditExpiry, annualBonusCredits, referralCreditAmt), access (maxMembers, geoRestriction, minimumAge, inviteOnly, repChannelOnly), rules (upgradeToTierIds, downgradeToTierIds, upgradeTiming, downgradeTiming, creditOnUpgrade, creditOnDowngrade), cancellation (minimumCommitMonths, cancelCreditBehavior, cancelCreditGraceDays, pauseAllowed, pauseMaxMonths, pauseCreditBehavior, winbackDays, winbackBonusCredits, exitSurveyRequired), and other fields (partnerDiscountPercent, includedAIFeatures, apparelCadence, apparelBudget, agentConfig, communityConfig, perksConfig).",
    input_schema: {
      type: "object" as const,
      properties: {
        planId: {
          type: "string",
          description: "The UUID of the plan to update",
        },
        fields: {
          type: "object",
          description:
            "Key-value map of fields to update. Keys must be valid SubscriptionTier field names. Values must match expected types (strings, numbers, booleans, arrays).",
        },
      },
      required: ["planId", "fields"],
    },
  },
  {
    name: "search_products",
    description:
      "Search and filter products from the catalog by name, category, margin, etc. Returns product data including retail price, cost of goods, margin, category, and sub-category.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search by product name or SKU",
        },
        category: {
          type: "string",
          description: "Filter by category (e.g. SUPPLEMENT, APPAREL)",
        },
        subCategory: {
          type: "string",
          description: "Filter by sub-category (e.g. Protein, Pre-Workout)",
        },
        maxMarginPercent: {
          type: "number",
          description: "Only products with margin % at or below this value",
        },
        minMarginPercent: {
          type: "number",
          description: "Only products with margin % at or above this value",
        },
      },
    },
  },
  {
    name: "create_discount_rule",
    description:
      "Create a new discount rule on a specific plan. Rules can target CATEGORY, SUB_CATEGORY, or SKU.",
    input_schema: {
      type: "object" as const,
      properties: {
        planId: { type: "string", description: "The UUID of the plan" },
        redemptionType: {
          type: "string",
          enum: ["MEMBERS_STORE", "MEMBERS_RATE"],
          description:
            "MEMBERS_STORE = credits-based. MEMBERS_RATE = cash discount.",
        },
        discountPercent: {
          type: "number",
          description: "Discount percentage off retail (0-100)",
        },
        scopeType: {
          type: "string",
          enum: ["CATEGORY", "SUB_CATEGORY", "SKU"],
          description:
            "Rule scope level. Priority: SKU > SUB_CATEGORY > CATEGORY",
        },
        scopeValue: {
          type: "string",
          description:
            "Target value: category name, sub-category, or product SKU",
        },
      },
      required: [
        "planId",
        "redemptionType",
        "discountPercent",
        "scopeType",
        "scopeValue",
      ],
    },
  },
  {
    name: "delete_discount_rule",
    description: "Delete an existing discount rule by its ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        planId: { type: "string", description: "The UUID of the plan" },
        ruleId: {
          type: "string",
          description: "The UUID of the rule to delete",
        },
      },
      required: ["planId", "ruleId"],
    },
  },
  {
    name: "list_discount_rules",
    description: "List all current discount rules for a specific plan.",
    input_schema: {
      type: "object" as const,
      properties: {
        planId: { type: "string", description: "The UUID of the plan" },
      },
      required: ["planId"],
    },
  },
  {
    name: "manage_agent_access",
    description:
      "Set AI agent assignments for a plan. Replaces all current assignments.",
    input_schema: {
      type: "object" as const,
      properties: {
        planId: { type: "string", description: "The UUID of the plan" },
        assignments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              agentId: { type: "string", description: "UUID of the AI agent" },
              isEnabled: { type: "boolean" },
              dailyUsageLimitOverride: {
                type: "number",
                description: "Optional daily usage limit",
              },
              priorityAccess: {
                type: "boolean",
                description: "Whether this tier gets priority access",
              },
            },
            required: ["agentId", "isEnabled"],
          },
        },
      },
      required: ["planId", "assignments"],
    },
  },
  {
    name: "manage_perks",
    description:
      "Set perk assignments for a plan. Replaces all current assignments.",
    input_schema: {
      type: "object" as const,
      properties: {
        planId: { type: "string", description: "The UUID of the plan" },
        assignments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              perkId: { type: "string", description: "UUID of the perk" },
              isEnabled: { type: "boolean" },
              configValue: {
                type: "string",
                description: "Optional sub-config value",
              },
            },
            required: ["perkId", "isEnabled"],
          },
        },
      },
      required: ["planId", "assignments"],
    },
  },
  {
    name: "manage_community",
    description:
      "Set community benefit assignments for a plan. Replaces all current assignments.",
    input_schema: {
      type: "object" as const,
      properties: {
        planId: { type: "string", description: "The UUID of the plan" },
        assignments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              communityBenefitId: {
                type: "string",
                description: "UUID of the community benefit",
              },
              isEnabled: { type: "boolean" },
            },
            required: ["communityBenefitId", "isEnabled"],
          },
        },
      },
      required: ["planId", "assignments"],
    },
  },
  {
    name: "manage_partners",
    description:
      "Set partner brand assignments for a plan. Replaces all current assignments.",
    input_schema: {
      type: "object" as const,
      properties: {
        planId: { type: "string", description: "The UUID of the plan" },
        assignments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              partnerBrandId: {
                type: "string",
                description: "UUID of the partner brand",
              },
              discountPercent: {
                type: "number",
                description: "Discount percentage for this partner",
              },
              isActive: { type: "boolean" },
            },
            required: ["partnerBrandId", "discountPercent"],
          },
        },
      },
      required: ["planId", "assignments"],
    },
  },
  {
    name: "navigate_user",
    description:
      "Navigate the user's browser to a specific plan and tab. Only use when the user explicitly asks to be taken somewhere. Valid tabs: identity, pricing, credits, access, rules, cancellation, products, agents, partners, perks, community.",
    input_schema: {
      type: "object" as const,
      properties: {
        planId: {
          type: "string",
          description: "The UUID of the plan to navigate to",
        },
        tab: {
          type: "string",
          description: "The tab to open",
        },
      },
      required: ["planId"],
    },
  },
];

// ─── Allowed fields for update_plan_fields ─────────────────────

const ALLOWED_FIELDS = new Set([
  // Identity
  "name", "slug", "tagline", "description", "colorAccent", "iconUrl",
  "highlightFeatures", "sortOrder", "status", "visibility", "isFeatured", "isActive",
  // Pricing
  "monthlyPrice", "quarterlyPrice", "annualPrice", "quarterlyDisplay", "annualDisplay",
  "setupFee", "trialDays", "billingAnchor",
  // Credits
  "monthlyCredits", "creditExpirationDays", "creditIssuing", "rolloverMonths",
  "rolloverCap", "creditExpiry", "annualBonusCredits", "referralCreditAmt",
  // Access
  "maxMembers", "geoRestriction", "minimumAge", "inviteOnly", "repChannelOnly",
  // Partner & apparel
  "partnerDiscountPercent", "includedAIFeatures", "apparelCadence", "apparelBudget",
  // Tier movement
  "upgradeToTierIds", "downgradeToTierIds", "upgradeTiming", "downgradeTiming",
  "creditOnUpgrade", "creditOnDowngrade",
  // Cancellation
  "minimumCommitMonths", "cancelCreditBehavior", "cancelCreditGraceDays",
  "pauseAllowed", "pauseMaxMonths", "pauseCreditBehavior",
  "winbackDays", "winbackBonusCredits", "exitSurveyRequired",
  // JSON configs
  "agentConfig", "communityConfig", "perksConfig",
]);

// ─── Tool Handler ──────────────────────────────────────────────

/**
 * Handle all Plans Architect tool calls.
 * Returns the tool result string, or null if the tool is not handled here.
 */
export async function handlePlanAgentToolCall(
  toolName: string,
  input: Record<string, unknown>,
  send: SendFn,
  allPlans?: Array<{ id: string; name: string; status: string; monthlyPrice: unknown }>
): Promise<string | null> {
  switch (toolName) {
    case "list_plans":
      return handleListPlans(send);
    case "get_plan_details":
      return handleGetPlanDetails(input, send);
    case "update_plan_fields":
      return handleUpdatePlanFields(input, send, allPlans);
    case "search_products":
      send("step", { text: "Searching products..." });
      return handleSearchProducts(input, send);
    case "create_discount_rule":
      return handleCreateDiscountRule(input, send);
    case "delete_discount_rule":
      return handleDeleteDiscountRule(input, send);
    case "list_discount_rules":
      return handleListDiscountRules(input, send);
    case "manage_agent_access":
      return handleManageAgents(input, send);
    case "manage_perks":
      return handleManagePerks(input, send);
    case "manage_community":
      return handleManageCommunity(input, send);
    case "manage_partners":
      return handleManagePartners(input, send);
    case "navigate_user":
      return handleNavigateUser(input, send, allPlans);
    default:
      return null; // Not a plan-agent tool
  }
}

// ─── Build Extra Context ───────────────────────────────────────

export async function buildPlanAgentContext(): Promise<{
  extraPrompt: string;
  allPlans: Array<{ id: string; name: string; status: string; monthlyPrice: unknown }>;
}> {
  const allPlans = await prisma.subscriptionTier.findMany({
    select: { id: true, name: true, status: true, monthlyPrice: true },
    orderBy: { sortOrder: "asc" },
  });

  const planList = allPlans
    .map(
      (p) =>
        `  - "${p.name}" (ID: ${p.id}) — ${p.status}, $${Number(p.monthlyPrice)}/mo`
    )
    .join("\n");

  const extraPrompt = `## Available Plans
${planList}

## Your Capabilities

### Plan Configuration (use update_plan_fields)
- **Identity**: name, slug, tagline, description, colorAccent, iconUrl, highlightFeatures, sortOrder, status, visibility, isFeatured
- **Pricing**: monthlyPrice, quarterlyPrice, annualPrice, quarterlyDisplay, annualDisplay, setupFee, trialDays, billingAnchor
- **Credits**: monthlyCredits, creditExpirationDays, creditIssuing, rolloverMonths, rolloverCap, creditExpiry, annualBonusCredits, referralCreditAmt
- **Access**: maxMembers, geoRestriction, minimumAge, inviteOnly, repChannelOnly
- **Rules**: upgradeToTierIds, downgradeToTierIds, upgradeTiming, downgradeTiming, creditOnUpgrade, creditOnDowngrade
- **Cancellation**: minimumCommitMonths, cancelCreditBehavior, cancelCreditGraceDays, pauseAllowed, pauseMaxMonths, pauseCreditBehavior, winbackDays, winbackBonusCredits, exitSurveyRequired

### Discount Rules (use create/delete/list_discount_rules)
- **MEMBERS_STORE**: Products bought with subscription credits at a discounted price
- **MEMBERS_RATE**: Flat % discount off retail, paid out-of-pocket (no credits used)
- **Scope levels**: CATEGORY > SUB_CATEGORY > SKU (most specific wins)

### Benefit Blocks (use manage_* tools)
- **Agents**: AI agent access per plan (manage_agent_access)
- **Partners**: Partner brand discounts per plan (manage_partners)
- **Perks**: Perk assignments per plan (manage_perks)
- **Community**: Community benefit assignments per plan (manage_community)

## How to Work
1. **Take action immediately.** When the user describes changes, execute them right away using tools. Do NOT just describe what you would do.
2. **Use get_plan_details first** when you need to understand current state before making changes.
3. **Cross-plan operations** are your strength. You can read from one plan and apply changes to another.
4. **Be concise.** Summarize what you did with a clear table or list after completing operations.

IMPORTANT: Always use tools to take action. Never respond with "I would..." or "You could..." — actually make the changes.`;

  return { extraPrompt, allPlans };
}

// ─── Individual Tool Handlers ──────────────────────────────────

async function handleListPlans(send: SendFn): Promise<string> {
  send("step", { text: "Loading all plans..." });
  try {
    const plans = await prisma.subscriptionTier.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        monthlyPrice: true,
        monthlyCredits: true,
        trialDays: true,
        isFeatured: true,
        _count: { select: { redemptionRules: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    send("step_complete", { text: `Found ${plans.length} plans` });
    if (plans.length === 0) return "No plans exist yet.";

    const lines = plans.map(
      (p) =>
        `- "${p.name}" (${p.id}) | ${p.status} | $${Number(p.monthlyPrice)}/mo | $${Number(p.monthlyCredits)} credits | ${p.trialDays}-day trial | ${p._count.redemptionRules} rules${p.isFeatured ? " | FEATURED" : ""}`
    );
    return `${plans.length} plans:\n${lines.join("\n")}`;
  } catch (err) {
    send("step_complete", { text: "Failed" });
    return `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

async function handleGetPlanDetails(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  const planId = String(input.planId);
  send("step", { text: "Loading plan details..." });

  try {
    const plan = await prisma.subscriptionTier.findUnique({
      where: { id: planId },
      include: {
        redemptionRules: {
          orderBy: [{ redemptionType: "asc" }, { scopeType: "asc" }],
        },
        partnerAssignments: {
          include: { partner: { select: { name: true } } },
        },
      },
    });

    if (!plan) {
      send("step_complete", { text: "Not found" });
      return `Error: Plan with ID "${planId}" not found.`;
    }

    const [agentAssignments, perkAssignments, communityAssignments] =
      await Promise.all([
        prisma.agentTierAccess.findMany({
          where: { subscriptionTierId: planId },
          include: { agent: { select: { name: true } } },
        }),
        prisma.perkTierAssignment.findMany({
          where: { subscriptionTierId: planId },
          include: { perk: { select: { name: true } } },
        }),
        prisma.communityBenefitTierAssignment.findMany({
          where: { subscriptionTierId: planId },
          include: { communityBenefit: { select: { name: true } } },
        }),
      ]);

    send("step_complete", { text: `Loaded ${plan.name}` });

    const sections: string[] = [];

    sections.push(`## Identity
- Name: ${plan.name}
- Slug: ${plan.slug}
- Tagline: ${plan.tagline || "(none)"}
- Description: ${plan.description || "(none)"}
- Color: ${plan.colorAccent}
- Status: ${plan.status}
- Visibility: ${plan.visibility}
- Featured: ${plan.isFeatured}
- Sort Order: ${plan.sortOrder}`);

    sections.push(`## Pricing
- Monthly: $${Number(plan.monthlyPrice)}
- Quarterly: $${Number(plan.quarterlyPrice)}
- Annual: $${Number(plan.annualPrice)}
- Setup Fee: $${Number(plan.setupFee)}
- Trial Days: ${plan.trialDays}
- Billing Anchor: ${plan.billingAnchor}`);

    sections.push(`## Credits
- Monthly Credits: $${Number(plan.monthlyCredits)}
- Expiration Days: ${plan.creditExpirationDays}
- Issuing: ${plan.creditIssuing}
- Rollover Months: ${plan.rolloverMonths}
- Rollover Cap: ${plan.rolloverCap != null ? `$${Number(plan.rolloverCap)}` : "uncapped"}
- Credit Expiry: ${plan.creditExpiry}
- Annual Bonus: $${Number(plan.annualBonusCredits)}
- Referral Credit: $${Number(plan.referralCreditAmt)}`);

    sections.push(`## Access
- Max Members: ${plan.maxMembers ?? "unlimited"}
- Invite Only: ${plan.inviteOnly}
- Rep Channel Only: ${plan.repChannelOnly}
- Geo Restrictions: ${plan.geoRestriction.length > 0 ? plan.geoRestriction.join(", ") : "none"}
- Minimum Age: ${plan.minimumAge ?? "none"}`);

    sections.push(`## Tier Movement
- Upgrade To: ${plan.upgradeToTierIds.length > 0 ? plan.upgradeToTierIds.join(", ") : "none"}
- Downgrade To: ${plan.downgradeToTierIds.length > 0 ? plan.downgradeToTierIds.join(", ") : "none"}
- Upgrade Timing: ${plan.upgradeTiming}
- Downgrade Timing: ${plan.downgradeTiming}
- Credit on Upgrade: ${plan.creditOnUpgrade}
- Credit on Downgrade: ${plan.creditOnDowngrade}`);

    sections.push(`## Cancellation
- Min Commitment: ${plan.minimumCommitMonths} months
- Cancel Credit Behavior: ${plan.cancelCreditBehavior}
- Cancel Grace Days: ${plan.cancelCreditGraceDays}
- Pause Allowed: ${plan.pauseAllowed}
- Pause Max Months: ${plan.pauseMaxMonths}
- Pause Credit Behavior: ${plan.pauseCreditBehavior}
- Win-back Days: ${plan.winbackDays}
- Win-back Bonus: $${Number(plan.winbackBonusCredits)}
- Exit Survey: ${plan.exitSurveyRequired}`);

    if (plan.redemptionRules.length > 0) {
      const ruleLines = plan.redemptionRules.map(
        (r) =>
          `  - [${r.id}] ${r.redemptionType} | ${r.scopeType}: ${r.scopeValue} | ${r.discountPercent}% off`
      );
      sections.push(
        `## Discount Rules (${plan.redemptionRules.length})\n${ruleLines.join("\n")}`
      );
    } else {
      sections.push("## Discount Rules\n  (none)");
    }

    const benefitLines: string[] = [];
    if (agentAssignments.length > 0) {
      benefitLines.push(
        `Agents: ${agentAssignments.map((a) => `${a.agent.name} (${a.isEnabled ? "enabled" : "disabled"})`).join(", ")}`
      );
    }
    if (perkAssignments.length > 0) {
      benefitLines.push(
        `Perks: ${perkAssignments.map((p) => `${p.perk.name} (${p.isEnabled ? "enabled" : "disabled"})`).join(", ")}`
      );
    }
    if (communityAssignments.length > 0) {
      benefitLines.push(
        `Community: ${communityAssignments.map((c) => `${c.communityBenefit.name} (${c.isEnabled ? "enabled" : "disabled"})`).join(", ")}`
      );
    }
    if (plan.partnerAssignments.length > 0) {
      benefitLines.push(
        `Partners: ${plan.partnerAssignments.map((p) => `${p.partner.name} (${Number(p.discountPercent)}% off)`).join(", ")}`
      );
    }
    sections.push(
      `## Benefits\n${benefitLines.length > 0 ? benefitLines.join("\n") : "  (none assigned)"}`
    );

    return sections.join("\n\n");
  } catch (err) {
    send("step_complete", { text: "Failed" });
    return `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

async function handleUpdatePlanFields(
  input: Record<string, unknown>,
  send: SendFn,
  allPlans?: Array<{ id: string; name: string }>
): Promise<string> {
  const planId = String(input.planId);
  const fields = input.fields as Record<string, unknown> | undefined;

  if (
    !fields ||
    typeof fields !== "object" ||
    Object.keys(fields).length === 0
  ) {
    return "Error: fields must be a non-empty object.";
  }

  const invalidFields = Object.keys(fields).filter(
    (k) => !ALLOWED_FIELDS.has(k)
  );
  if (invalidFields.length > 0) {
    return `Error: Invalid field names: ${invalidFields.join(", ")}`;
  }

  const planName = allPlans?.find((p) => p.id === planId)?.name || planId;
  send("step", { text: `Updating ${planName}...` });

  try {
    await prisma.subscriptionTier.update({
      where: { id: planId },
      data: fields,
    });

    const fieldNames = Object.keys(fields);
    send("step_complete", { text: `Updated ${fieldNames.length} field(s)` });
    send("plan_updated", { planId, planName, updatedFields: fields });

    return `Successfully updated ${planName}: ${fieldNames.map((f) => `${f} = ${JSON.stringify(fields[f])}`).join(", ")}`;
  } catch (err) {
    send("step_complete", { text: "Update failed" });
    return `Error updating plan: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

async function handleSearchProducts(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  try {
    const where: Record<string, unknown> = { isActive: true };
    if (input.category) where.category = String(input.category);
    if (input.subCategory) where.subCategory = String(input.subCategory);
    if (input.query) {
      const q = String(input.query);
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        subCategory: true,
        retailPrice: true,
        costOfGoods: true,
        memberPrice: true,
      },
      take: 100,
      orderBy: { name: "asc" },
    });

    let filtered = products.map((p) => {
      const retail = Number(p.retailPrice);
      const cogs = Number(p.costOfGoods);
      const marginPercent =
        retail > 0 ? ((retail - cogs) / retail) * 100 : 0;
      return {
        ...p,
        marginPercent: Math.round(marginPercent * 100) / 100,
      };
    });

    if (input.maxMarginPercent !== undefined) {
      filtered = filtered.filter(
        (p) => p.marginPercent <= Number(input.maxMarginPercent)
      );
    }
    if (input.minMarginPercent !== undefined) {
      filtered = filtered.filter(
        (p) => p.marginPercent >= Number(input.minMarginPercent)
      );
    }

    send("step_complete", { text: `Found ${filtered.length} products` });
    if (filtered.length === 0)
      return "No products found matching the criteria.";

    const lines = filtered.map(
      (p) =>
        `- ${p.name} (SKU: ${p.sku}) | ${p.category}${p.subCategory ? ` / ${p.subCategory}` : ""} | Retail: $${Number(p.retailPrice).toFixed(2)} | COGS: $${Number(p.costOfGoods).toFixed(2)} | Margin: ${p.marginPercent}%`
    );
    return `Found ${filtered.length} products:\n${lines.join("\n")}`;
  } catch (err) {
    send("step_complete", { text: "Search failed" });
    return `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

async function handleCreateDiscountRule(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  const planId = String(input.planId);
  const redemptionType = String(input.redemptionType);
  const discountPercent = Math.round(Number(input.discountPercent));
  const scopeType = String(input.scopeType);
  const scopeValue = String(input.scopeValue);

  send("step", { text: `Creating rule: ${scopeType} ${scopeValue}...` });

  if (!["MEMBERS_STORE", "MEMBERS_RATE"].includes(redemptionType)) {
    send("step_complete", { text: "Invalid type" });
    return `Error: Invalid redemptionType "${redemptionType}". Must be MEMBERS_STORE or MEMBERS_RATE.`;
  }
  if (!["CATEGORY", "SUB_CATEGORY", "SKU"].includes(scopeType)) {
    send("step_complete", { text: "Invalid scope" });
    return `Error: Invalid scopeType "${scopeType}". Must be CATEGORY, SUB_CATEGORY, or SKU.`;
  }
  if (discountPercent < 0 || discountPercent > 100) {
    send("step_complete", { text: "Invalid percent" });
    return `Error: discountPercent must be between 0 and 100.`;
  }

  try {
    const existing = await prisma.subscriptionRedemptionRule.findUnique({
      where: {
        subscriptionTierId_redemptionType_scopeType_scopeValue: {
          subscriptionTierId: planId,
          redemptionType,
          scopeType,
          scopeValue,
        },
      },
    });
    if (existing) {
      send("step_complete", { text: "Duplicate" });
      return `Rule already exists: ${redemptionType} | ${scopeType}: ${scopeValue} at ${existing.discountPercent}% off. Delete it first to change it.`;
    }

    const rule = await prisma.subscriptionRedemptionRule.create({
      data: {
        subscriptionTierId: planId,
        redemptionType,
        discountPercent,
        scopeType,
        scopeValue,
      },
    });

    send("step_complete", { text: "Rule created" });
    send("rule_created", {
      planId,
      ruleId: rule.id,
      redemptionType,
      scopeType,
      scopeValue,
      discountPercent,
    });

    return `Created rule: ${redemptionType} | ${scopeType}: ${scopeValue} | ${discountPercent}% off (ID: ${rule.id})`;
  } catch (err) {
    send("step_complete", { text: "Failed" });
    return `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

async function handleDeleteDiscountRule(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  const planId = String(input.planId);
  const ruleId = String(input.ruleId);

  send("step", { text: "Deleting rule..." });

  try {
    const rule = await prisma.subscriptionRedemptionRule.findFirst({
      where: { id: ruleId, subscriptionTierId: planId },
    });
    if (!rule) {
      send("step_complete", { text: "Not found" });
      return `Error: Rule "${ruleId}" not found on this plan.`;
    }

    await prisma.subscriptionRedemptionRule.delete({
      where: { id: ruleId },
    });

    send("step_complete", { text: "Rule deleted" });
    send("rule_deleted", { planId, ruleId });

    return `Deleted rule: ${rule.redemptionType} | ${rule.scopeType}: ${rule.scopeValue} | ${rule.discountPercent}% off`;
  } catch (err) {
    send("step_complete", { text: "Failed" });
    return `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

async function handleListDiscountRules(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  const planId = String(input.planId);
  send("step", { text: "Loading rules..." });

  try {
    const rules = await prisma.subscriptionRedemptionRule.findMany({
      where: { subscriptionTierId: planId },
      orderBy: [{ redemptionType: "asc" }, { scopeType: "asc" }],
    });

    send("step_complete", { text: `${rules.length} rules` });
    if (rules.length === 0) return "No discount rules exist for this plan.";

    const lines = rules.map(
      (r) =>
        `- [${r.id}] ${r.redemptionType} | ${r.scopeType}: ${r.scopeValue} | ${r.discountPercent}% off`
    );
    return `Current rules (${rules.length}):\n${lines.join("\n")}`;
  } catch (err) {
    send("step_complete", { text: "Failed" });
    return `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

async function handleManageAgents(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  const planId = String(input.planId);
  const assignments = input.assignments as Array<{
    agentId: string;
    isEnabled: boolean;
    dailyUsageLimitOverride?: number | null;
    priorityAccess?: boolean;
  }>;

  send("step", { text: "Updating agent assignments..." });

  try {
    await prisma.$transaction([
      prisma.agentTierAccess.deleteMany({
        where: { subscriptionTierId: planId },
      }),
      prisma.agentTierAccess.createMany({
        data: assignments.map((a) => ({
          subscriptionTierId: planId,
          agentId: a.agentId,
          isEnabled: a.isEnabled,
          dailyUsageLimitOverride: a.dailyUsageLimitOverride ?? null,
          priorityAccess: a.priorityAccess ?? false,
        })),
      }),
    ]);

    send("step_complete", { text: `${assignments.length} agents assigned` });
    send("benefits_updated", { planId, blockName: "agents" });

    return `Updated agent assignments: ${assignments.length} agents configured.`;
  } catch (err) {
    send("step_complete", { text: "Failed" });
    return `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

async function handleManagePerks(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  const planId = String(input.planId);
  const assignments = input.assignments as Array<{
    perkId: string;
    isEnabled: boolean;
    configValue?: string | null;
  }>;

  send("step", { text: "Updating perk assignments..." });

  try {
    const enabledOnly = assignments.filter((a) => a.isEnabled);
    await prisma.$transaction([
      prisma.perkTierAssignment.deleteMany({
        where: { subscriptionTierId: planId },
      }),
      prisma.perkTierAssignment.createMany({
        data: enabledOnly.map((a) => ({
          subscriptionTierId: planId,
          perkId: a.perkId,
          isEnabled: true,
          configValue: a.configValue ?? null,
        })),
      }),
    ]);

    send("step_complete", { text: `${enabledOnly.length} perks enabled` });
    send("benefits_updated", { planId, blockName: "perks" });

    return `Updated perk assignments: ${enabledOnly.length} perks enabled.`;
  } catch (err) {
    send("step_complete", { text: "Failed" });
    return `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

async function handleManageCommunity(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  const planId = String(input.planId);
  const assignments = input.assignments as Array<{
    communityBenefitId: string;
    isEnabled: boolean;
  }>;

  send("step", { text: "Updating community assignments..." });

  try {
    const enabledOnly = assignments.filter((a) => a.isEnabled);
    await prisma.$transaction([
      prisma.communityBenefitTierAssignment.deleteMany({
        where: { subscriptionTierId: planId },
      }),
      prisma.communityBenefitTierAssignment.createMany({
        data: enabledOnly.map((a) => ({
          subscriptionTierId: planId,
          communityBenefitId: a.communityBenefitId,
          isEnabled: true,
        })),
      }),
    ]);

    send("step_complete", {
      text: `${enabledOnly.length} benefits enabled`,
    });
    send("benefits_updated", { planId, blockName: "community" });

    return `Updated community assignments: ${enabledOnly.length} benefits enabled.`;
  } catch (err) {
    send("step_complete", { text: "Failed" });
    return `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

async function handleManagePartners(
  input: Record<string, unknown>,
  send: SendFn
): Promise<string> {
  const planId = String(input.planId);
  const assignments = input.assignments as Array<{
    partnerBrandId: string;
    discountPercent: number;
    isActive?: boolean;
  }>;

  send("step", { text: "Updating partner assignments..." });

  try {
    await prisma.$transaction([
      prisma.partnerTierAssignment.deleteMany({
        where: { subscriptionTierId: planId },
      }),
      prisma.partnerTierAssignment.createMany({
        data: assignments.map((a) => ({
          subscriptionTierId: planId,
          partnerBrandId: a.partnerBrandId,
          discountPercent: a.discountPercent,
          isActive: a.isActive ?? true,
        })),
      }),
    ]);

    send("step_complete", {
      text: `${assignments.length} partners assigned`,
    });
    send("benefits_updated", { planId, blockName: "partners" });

    return `Updated partner assignments: ${assignments.length} partners configured.`;
  } catch (err) {
    send("step_complete", { text: "Failed" });
    return `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

function handleNavigateUser(
  input: Record<string, unknown>,
  send: SendFn,
  allPlans?: Array<{ id: string; name: string }>
): string {
  const planId = String(input.planId);
  const tab = String(input.tab || "identity");
  const plan = allPlans?.find((p) => p.id === planId);

  if (!plan) {
    return `Error: Plan "${planId}" not found. Use list_plans to see available plans.`;
  }

  send("navigate", { planId, planName: plan.name, tab });

  return `Navigating user to "${plan.name}" → ${tab} tab.`;
}
