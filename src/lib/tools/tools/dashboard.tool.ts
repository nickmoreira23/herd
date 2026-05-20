import type { Tool } from "../manifest";

export const dashboardTool: Tool = {
  kind: "tool",
  name: "dashboard",
  displayName: "Dashboard",
  description:
    "Operational overview dashboard. Aggregates key metrics across products, subscriptions, partners, and financial snapshots into a single landing.",
  icon: "LayoutDashboard",
  color: "#64748b",
  status: "active",
  hasSubRoutes: false,
  area: "workflow",
  blocks: [
    {
      blockName: "products",
      usage: "read",
      purpose: "Product count and active count",
    },
    {
      blockName: "subscriptions",
      usage: "read",
      purpose: "Tier listing and pricing aggregation",
    },
  ],
  actions: [],
  paths: {
    page: "src/app/admin",
  },
};
