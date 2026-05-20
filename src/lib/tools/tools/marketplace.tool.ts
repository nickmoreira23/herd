import type { Tool } from "../manifest";

export const marketplaceTool: Tool = {
  kind: "tool",
  name: "marketplace",
  displayName: "Marketplace",
  description:
    "Public-facing storefront. Composes products, services, subscriptions, and packages into sellable items with sections, visibility, and renderer.",
  icon: "ShoppingBag",
  color: "#10b981",
  status: "active",
  hasSubRoutes: true,
  area: "transaction",
  blocks: [
    {
      blockName: "products",
      usage: "read",
      purpose: "Product catalog for marketplace items",
    },
    {
      blockName: "services",
      usage: "read",
      purpose: "Service catalog for marketplace items",
    },
    {
      blockName: "subscriptions",
      usage: "read",
      purpose: "Subscription tiers exposed in storefront",
    },
  ],
  actions: [],
  paths: {
    page: "src/app/admin/marketplace",
    components: "src/components/marketplace",
    api: "src/app/api/marketplace",
  },
};
