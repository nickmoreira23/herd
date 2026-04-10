import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import {
  executeAction,
  formatActionResult,
} from "@/lib/chat/action-execution";
import { resolveAnthropicKey } from "@/lib/integrations";

// ─── Tools ───────────────────────────────────────────────────────

const SEARCH_PRODUCTS_TOOL: Anthropic.Tool = {
  name: "search_products",
  description:
    "Search and filter products from the catalog. Use this to find products by name, category, margin, price range, etc. Returns full product data including retail price, cost of goods, margin, category, and sub-category.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Search by product name or SKU (optional)",
      },
      category: {
        type: "string",
        description: "Filter by category (e.g. SUPPLEMENT, APPAREL, ACCESSORY)",
      },
      subCategory: {
        type: "string",
        description: "Filter by sub-category (e.g. Protein, Pre-Workout)",
      },
      maxMarginPercent: {
        type: "number",
        description:
          "Only return products with margin % at or below this value. Margin = (retail - COGS) / retail * 100",
      },
      minMarginPercent: {
        type: "number",
        description: "Only return products with margin % at or above this value",
      },
    },
  },
};

const CREATE_RULE_TOOL: Anthropic.Tool = {
  name: "create_discount_rule",
  description:
    "Create a new discount rule for this tier. Rules can target a CATEGORY, SUB_CATEGORY, or specific SKU.",
  input_schema: {
    type: "object" as const,
    properties: {
      redemptionType: {
        type: "string",
        enum: ["MEMBERS_STORE", "MEMBERS_RATE"],
        description:
          "MEMBERS_STORE = bought with subscription credits at discount off retail. MEMBERS_RATE = flat % discount off retail, paid out-of-pocket (no credits used).",
      },
      discountPercent: {
        type: "number",
        description: "Discount percentage off retail (0-100)",
      },
      scopeType: {
        type: "string",
        enum: ["CATEGORY", "SUB_CATEGORY", "SKU"],
        description:
          "What level this rule applies to. Priority: SKU > SUB_CATEGORY > CATEGORY",
      },
      scopeValue: {
        type: "string",
        description:
          "The target value — a category name (e.g. SUPPLEMENT), sub-category (e.g. Protein), or a product SKU",
      },
    },
    required: ["redemptionType", "discountPercent", "scopeType", "scopeValue"],
  },
};

const DELETE_RULE_TOOL: Anthropic.Tool = {
  name: "delete_discount_rule",
  description: "Delete an existing discount rule by its ID",
  input_schema: {
    type: "object" as const,
    properties: {
      ruleId: {
        type: "string",
        description: "The UUID of the rule to delete",
      },
    },
    required: ["ruleId"],
  },
};

const LIST_RULES_TOOL: Anthropic.Tool = {
  name: "list_current_rules",
  description:
    "List all current discount rules for this tier. Use this to see what rules already exist before creating new ones.",
  input_schema: {
    type: "object" as const,
    properties: {},
  },
};

// ─── System Prompt Builder ───────────────────────────────────────

function buildSystemPrompt(
  tierName: string,
  existingRules: Array<{
    id: string;
    redemptionType: string;
    discountPercent: number;
    scopeType: string;
    scopeValue: string;
  }>
): string {
  const rulesText =
    existingRules.length > 0
      ? existingRules
          .map(
            (r) =>
              `  - [${r.id}] ${r.redemptionType} | ${r.scopeType}: ${r.scopeValue} | ${r.discountPercent}% off`
          )
          .join("\n")
      : "  (none)";

  return `You are HERD's Plan Builder AI — a specialist in creating subscription tier discount rules. You help users build tier benefit plans using natural language.

## Concepts

**Members Store (MEMBERS_STORE)**
Products bought using monthly subscription credits at a discounted price. The discount is applied to the retail price, and the discounted amount is what gets deducted from the member's credit balance.
Example: A $50 product at 40% off → member pays 30 credits.

**Members Rate (MEMBERS_RATE)**
A flat percentage discount on retail price, paid out-of-pocket by the member — no credits are used. Great for items outside the core store credit system.
Example: A $50 product at 20% off → member pays $40 cash.

**Rule Scope Levels**
- CATEGORY: Applies to ALL products in a category (e.g., all SUPPLEMENT products)
- SUB_CATEGORY: Applies to all products in a sub-category (e.g., all Protein products)
- SKU: Applies to one specific product by its SKU

**Priority**: If a product matches multiple rules, the most specific wins:
SKU rule > SUB_CATEGORY rule > CATEGORY rule

## Current Tier: "${tierName}"

### Existing Rules:
${rulesText}

## How to work

1. When the user describes a rule in natural language, first understand what they want
2. If the request involves product data (margins, prices, categories), use search_products to look it up
3. Use list_current_rules to check what already exists before creating duplicates
4. Show the user what you plan to create and ask for confirmation on large batches
5. Create rules using create_discount_rule
6. For SKU-level rules on many products, create them one at a time

Be concise and action-oriented. When creating rules, report what was created clearly.`;
}

// ─── POST Handler ────────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tierId: string }> }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Unauthorized", 401);

  let anthropic: Anthropic;
  try {
    const apiKey = await resolveAnthropicKey();
    anthropic = new Anthropic({ apiKey });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "API key not configured", 500);
  }

  const { tierId } = await params;

  // Verify tier exists
  const tier = await prisma.subscriptionTier.findUnique({
    where: { id: tierId },
    select: { id: true, name: true },
  });
  if (!tier) return apiError("Tier not found", 404);

  let body: { content: string; history?: Array<{ role: string; content: string }> };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }

  if (!body.content || typeof body.content !== "string") {
    return apiError("content is required", 400);
  }

  // Load current rules for context
  const existingRules = await prisma.subscriptionRedemptionRule.findMany({
    where: { subscriptionTierId: tierId },
    orderBy: [{ redemptionType: "asc" }, { scopeType: "asc" }],
    select: {
      id: true,
      redemptionType: true,
      discountPercent: true,
      scopeType: true,
      scopeValue: true,
    },
  });

  const systemPrompt = buildSystemPrompt(tier.name, existingRules);

  // Build messages: include history if provided
  const messages: Anthropic.MessageParam[] = [];
  if (body.history) {
    for (const msg of body.history) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }
  }
  messages.push({ role: "user", content: body.content });

  const encoder = new TextEncoder();
  let streamClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        if (streamClosed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          streamClosed = true;
        }
      }

      let fullResponse = "";
      let toolCallCount = 0;

      try {
        let currentMessages = [...messages];
        let continueLoop = true;

        while (continueLoop) {
          const response = anthropic.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: systemPrompt,
            tools: [SEARCH_PRODUCTS_TOOL, CREATE_RULE_TOOL, DELETE_RULE_TOOL, LIST_RULES_TOOL],
            messages: currentMessages,
          });

          let toolUseBlock: { id: string; name: string; input: string } | null = null;
          let currentTextDelta = "";

          for await (const event of response) {
            if (streamClosed) break;

            if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                toolUseBlock = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: "",
                };
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                currentTextDelta += event.delta.text;
                fullResponse += event.delta.text;
                send("token", { text: event.delta.text });
              } else if (
                event.delta.type === "input_json_delta" &&
                toolUseBlock
              ) {
                toolUseBlock.input += event.delta.partial_json;
              }
            } else if (event.type === "message_delta") {
              if (event.delta.stop_reason === "tool_use" && toolUseBlock) {
                let toolInput: Record<string, unknown>;
                try {
                  toolInput = JSON.parse(toolUseBlock.input);
                } catch {
                  toolInput = {};
                }

                toolCallCount++;
                let toolResultContent: string;

                if (toolUseBlock.name === "search_products") {
                  send("step", { text: "Searching products..." });
                  toolResultContent = await handleSearchProducts(toolInput);
                  send("step_complete", { text: "Search complete" });
                } else if (toolUseBlock.name === "create_discount_rule") {
                  send("step", { text: `Creating rule: ${toolInput.scopeType} ${toolInput.scopeValue}...` });
                  toolResultContent = await handleCreateRule(tierId, toolInput, userId);
                  send("step_complete", { text: "Rule created" });
                  send("rules_changed", {});
                } else if (toolUseBlock.name === "delete_discount_rule") {
                  send("step", { text: "Deleting rule..." });
                  toolResultContent = await handleDeleteRule(tierId, toolInput as { ruleId: string }, userId);
                  send("step_complete", { text: "Rule deleted" });
                  send("rules_changed", {});
                } else if (toolUseBlock.name === "list_current_rules") {
                  send("step", { text: "Loading current rules..." });
                  toolResultContent = await handleListRules(tierId);
                  send("step_complete", { text: "Rules loaded" });
                } else {
                  toolResultContent = "Unknown tool";
                }

                currentMessages = [
                  ...currentMessages,
                  {
                    role: "assistant" as const,
                    content: [
                      ...(currentTextDelta
                        ? [{ type: "text" as const, text: currentTextDelta }]
                        : []),
                      {
                        type: "tool_use" as const,
                        id: toolUseBlock.id,
                        name: toolUseBlock.name,
                        input: toolInput,
                      },
                    ],
                  },
                  {
                    role: "user" as const,
                    content: [
                      {
                        type: "tool_result" as const,
                        tool_use_id: toolUseBlock.id,
                        content: toolResultContent,
                      },
                    ],
                  },
                ];

                currentTextDelta = "";
                break;
              } else if (event.delta.stop_reason === "end_turn") {
                continueLoop = false;
                break;
              }
            }
          }

          if (!toolUseBlock && continueLoop) {
            continueLoop = false;
          }
          toolUseBlock = null;
        }

        send("done", { response: fullResponse });
      } catch (err) {
        console.error("Plan builder chat error:", err);
        send("error", {
          message: err instanceof Error ? err.message : "An error occurred",
        });
      } finally {
        if (!streamClosed) {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
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

// ─── Tool Handlers ───────────────────────────────────────────────

async function handleSearchProducts(
  input: Record<string, unknown>
): Promise<string> {
  try {
    const where: Record<string, unknown> = { isActive: true };

    if (input.category) {
      where.category = String(input.category);
    }
    if (input.subCategory) {
      where.subCategory = String(input.subCategory);
    }
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
        isActive: true,
      },
      take: 100,
      orderBy: { name: "asc" },
    });

    // Apply margin filters in JS (Prisma can't compute derived fields)
    let filtered = products.map((p) => {
      const retail = Number(p.retailPrice);
      const cogs = Number(p.costOfGoods);
      const marginPercent = retail > 0 ? ((retail - cogs) / retail) * 100 : 0;
      return { ...p, marginPercent: Math.round(marginPercent * 100) / 100 };
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

    if (filtered.length === 0) {
      return "No products found matching the criteria.";
    }

    const lines = filtered.map(
      (p) =>
        `- ${p.name} (SKU: ${p.sku}) | Category: ${p.category}${p.subCategory ? ` / ${p.subCategory}` : ""} | Retail: $${Number(p.retailPrice).toFixed(2)} | COGS: $${Number(p.costOfGoods).toFixed(2)} | Margin: ${p.marginPercent}%`
    );

    return `Found ${filtered.length} products:\n${lines.join("\n")}`;
  } catch (err) {
    return `Error searching products: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

async function handleCreateRule(
  tierId: string,
  input: Record<string, unknown>,
  userId: string
): Promise<string> {
  const result = await executeAction(
    "create_redemption_rule",
    { tierId, ...input },
    userId
  );
  return formatActionResult(result);
}

async function handleDeleteRule(
  tierId: string,
  input: { ruleId: string },
  userId: string
): Promise<string> {
  const result = await executeAction(
    "delete_redemption_rule",
    { tierId, id: input.ruleId },
    userId
  );
  return formatActionResult(result);
}

async function handleListRules(tierId: string): Promise<string> {
  try {
    const rules = await prisma.subscriptionRedemptionRule.findMany({
      where: { subscriptionTierId: tierId },
      orderBy: [{ redemptionType: "asc" }, { scopeType: "asc" }],
    });

    if (rules.length === 0) {
      return "No discount rules exist for this tier yet.";
    }

    const lines = rules.map(
      (r) =>
        `- [${r.id}] ${r.redemptionType} | ${r.scopeType}: ${r.scopeValue} | ${r.discountPercent}% off`
    );
    return `Current rules (${rules.length}):\n${lines.join("\n")}`;
  } catch (err) {
    return `Error listing rules: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}
