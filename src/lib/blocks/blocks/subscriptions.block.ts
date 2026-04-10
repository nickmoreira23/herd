import type { BlockManifest } from "../manifest";

export const subscriptionsBlock: BlockManifest = {
  name: "subscriptions",
  displayName: "Subscriptions",
  description:
    "Subscription tier management — discount rules for Members Store and Members Rate. Supports creating, updating, and deleting redemption rules that control product pricing for tier members.",
  domain: "foundation",
  types: ["subscription_tier", "redemption_rule"],
  capabilities: ["read", "create", "update", "delete"],
  models: ["SubscriptionTier", "SubscriptionRedemptionRule"],
  dependencies: ["products"],
  paths: {
    components: "src/components/tiers/",
    pages: "src/app/admin/plans/",
    api: "src/app/api/subscriptions/",
    validators: "src/lib/validators/redemption-rule.ts",
  },
  actions: [
    {
      name: "list_redemption_rules",
      description:
        "List all discount redemption rules for a subscription tier",
      method: "GET",
      endpoint: "/api/subscriptions/{tierId}/redemption-rules",
      parametersSchema: {
        type: "object",
        properties: {
          tierId: {
            type: "string",
            description: "The subscription tier UUID",
          },
        },
        required: ["tierId"],
      },
      requiredFields: ["tierId"],
      responseDescription:
        "Array of redemption rule objects with redemptionType, discountPercent, scopeType, scopeValue",
    },
    {
      name: "create_redemption_rule",
      description:
        "Create a new discount rule for a subscription tier. Rules can target an entire CATEGORY, a SUB_CATEGORY, or a specific product SKU. redemptionType is either MEMBERS_STORE (credits-based purchase) or MEMBERS_RATE (flat discount, out-of-pocket).",
      method: "POST",
      endpoint: "/api/subscriptions/{tierId}/redemption-rules",
      parametersSchema: {
        type: "object",
        properties: {
          tierId: {
            type: "string",
            description: "The subscription tier UUID",
          },
          redemptionType: {
            type: "string",
            enum: ["MEMBERS_STORE", "MEMBERS_RATE"],
            description:
              "MEMBERS_STORE = bought with credits at discount; MEMBERS_RATE = flat % off retail, paid out-of-pocket",
          },
          discountPercent: {
            type: "number",
            description: "Discount percentage (0-100) off retail price",
          },
          scopeType: {
            type: "string",
            enum: ["CATEGORY", "SUB_CATEGORY", "SKU"],
            description:
              "What level this rule targets. SKU overrides SUB_CATEGORY which overrides CATEGORY.",
          },
          scopeValue: {
            type: "string",
            description:
              "The category name (e.g. SUPPLEMENT), sub-category name (e.g. Protein), or product SKU",
          },
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
      responseDescription: "The created redemption rule object",
    },
    {
      name: "update_redemption_rule",
      description:
        "Update the discount percentage of an existing redemption rule",
      method: "PATCH",
      endpoint: "/api/subscriptions/{tierId}/redemption-rules/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          tierId: {
            type: "string",
            description: "The subscription tier UUID",
          },
          id: {
            type: "string",
            description: "The redemption rule UUID",
          },
          discountPercent: {
            type: "number",
            description: "New discount percentage (0-100)",
          },
        },
        required: ["tierId", "id", "discountPercent"],
      },
      requiredFields: ["tierId", "id", "discountPercent"],
      responseDescription: "The updated redemption rule object",
    },
    {
      name: "delete_redemption_rule",
      description: "Delete a discount redemption rule from a tier",
      method: "DELETE",
      endpoint: "/api/subscriptions/{tierId}/redemption-rules/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          tierId: {
            type: "string",
            description: "The subscription tier UUID",
          },
          id: {
            type: "string",
            description: "The redemption rule UUID to delete",
          },
        },
        required: ["tierId", "id"],
      },
      requiredFields: ["tierId", "id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
