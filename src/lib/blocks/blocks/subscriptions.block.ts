import type { BlockManifest } from "../manifest";

const STATUS_ENUM = ["DRAFT", "ACTIVE", "ARCHIVED"];
const VISIBILITY_ENUM = ["PUBLIC", "PRIVATE", "INVITE_ONLY"];

export const subscriptionsBlock: BlockManifest = {
  kind: "block",
  name: "subscriptions",
  displayName: "Subscriptions",
  description:
    "Subscription plans (tiers) the organization offers — the catalog of recurring memberships customers can subscribe to. Each plan has pricing across billing cycles (monthly/quarterly/annual), monthly credits, included perks, agent access, partner discounts, status & visibility controls, lifecycle policies (trials, pauses, cancellations), and a set of benefit blocks attached to it. The block also owns the discount redemption rules (Members Store / Members Rate) that govern product pricing for plan members. Lives in the Commerce category.",
  types: ["subscription_tier", "redemption_rule"],
  capabilities: ["read", "create", "update", "delete"],
  models: ["SubscriptionTier", "SubscriptionRedemptionRule"],
  dependencies: ["products"],
  paths: {
    components: "src/components/tiers/",
    pages: "src/app/admin/blocks/subscriptions/",
    api: "src/app/api/tiers/",
    validators: "src/lib/validators/tier.ts",
    provider: "src/lib/chat/providers/subscription.provider.ts",
  },
  actions: [
    {
      name: "list_subscriptions",
      description:
        "List subscription plans (tiers) ordered by sortOrder, with pricing, status, visibility, included credits and feature highlights.",
      method: "GET",
      endpoint: "/api/tiers",
      parametersSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: STATUS_ENUM },
          visibility: { type: "string", enum: VISIBILITY_ENUM },
          search: { type: "string" },
          limit: { type: "number" },
          offset: { type: "number" },
        },
      },
      responseDescription:
        "{ tiers: SubscriptionTier[], total: number } — each tier serializes Decimal pricing as numbers",
    },
    {
      name: "get_subscription",
      description:
        "Get a single subscription plan (tier) by ID with full pricing, credits, lifecycle, agent access and partner assignments.",
      method: "GET",
      endpoint: "/api/tiers/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Single SubscriptionTier with relations.",
    },
    {
      name: "create_subscription",
      description:
        "Create a new subscription plan (tier). At minimum needs a name, slug and the three pricing fields (monthly/quarterly/annual).",
      method: "POST",
      endpoint: "/api/tiers",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          tagline: { type: "string" },
          status: { type: "string", enum: STATUS_ENUM },
          visibility: { type: "string", enum: VISIBILITY_ENUM },
          monthlyPrice: { type: "number" },
          quarterlyPrice: { type: "number" },
          annualPrice: { type: "number" },
          monthlyCredits: { type: "number" },
        },
        required: ["name", "slug"],
      },
      requiredFields: ["name", "slug"],
      responseDescription: "Created tier record",
    },
    {
      name: "update_subscription",
      description:
        "Update a subscription plan (tier). All fields are optional; pass only what's changing.",
      method: "PATCH",
      endpoint: "/api/tiers/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated tier record",
    },
    {
      name: "delete_subscription",
      description: "Delete a subscription plan (tier).",
      method: "DELETE",
      endpoint: "/api/tiers/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "{ deleted: true }",
    },
    {
      name: "list_redemption_rules",
      description:
        "List discount redemption rules attached to a subscription plan.",
      method: "GET",
      endpoint: "/api/subscriptions/{tierId}/redemption-rules",
      parametersSchema: {
        type: "object",
        properties: { tierId: { type: "string" } },
        required: ["tierId"],
      },
      requiredFields: ["tierId"],
      responseDescription:
        "Array of redemption rules with redemptionType, discountPercent, scopeType, scopeValue.",
    },
    {
      name: "create_redemption_rule",
      description:
        "Create a redemption rule for a subscription plan. MEMBERS_STORE = credit-based purchase at discount; MEMBERS_RATE = flat % off retail. Scope can be CATEGORY, SUB_CATEGORY or SKU.",
      method: "POST",
      endpoint: "/api/subscriptions/{tierId}/redemption-rules",
      parametersSchema: {
        type: "object",
        properties: {
          tierId: { type: "string" },
          redemptionType: {
            type: "string",
            enum: ["MEMBERS_STORE", "MEMBERS_RATE"],
          },
          discountPercent: { type: "number" },
          scopeType: { type: "string", enum: ["CATEGORY", "SUB_CATEGORY", "SKU"] },
          scopeValue: { type: "string" },
        },
        required: [
          "tierId",
          "redemptionType",
          "discountPercent",
          "scopeType",
          "scopeValue",
        ],
      },
      requiredFields: [
        "tierId",
        "redemptionType",
        "discountPercent",
        "scopeType",
        "scopeValue",
      ],
      responseDescription: "The created redemption rule",
    },
    {
      name: "update_redemption_rule",
      description: "Update a redemption rule's discount percentage.",
      method: "PATCH",
      endpoint: "/api/subscriptions/{tierId}/redemption-rules/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          tierId: { type: "string" },
          id: { type: "string" },
          discountPercent: { type: "number" },
        },
        required: ["tierId", "id", "discountPercent"],
      },
      requiredFields: ["tierId", "id", "discountPercent"],
      responseDescription: "The updated redemption rule",
    },
    {
      name: "delete_redemption_rule",
      description: "Delete a redemption rule from a subscription plan.",
      method: "DELETE",
      endpoint: "/api/subscriptions/{tierId}/redemption-rules/{id}",
      parametersSchema: {
        type: "object",
        properties: { tierId: { type: "string" }, id: { type: "string" } },
        required: ["tierId", "id"],
      },
      requiredFields: ["tierId", "id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
