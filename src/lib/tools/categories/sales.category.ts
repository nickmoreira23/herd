import type { ToolCategoryManifest } from "../manifest";

export const salesCategory: ToolCategoryManifest = {
  kind: "tool_category",
  name: "sales",
  displayName: "Sales",
  description:
    "Sales tools for pipeline management, quota tracking, and team performance. Manage deals, set targets, and monitor rep performance across the organization.",
  icon: "Target",
  color: "#ef4444",
  domain: "sales",
  sortOrder: 30,
  capabilities: [
    "Manage sales pipeline and deals",
    "Set and track sales targets and quotas",
    "Monitor team and rep performance",
  ],
  tools: [
    {
      kind: "tool",
      name: "packages",
      displayName: "Packages",
      description:
        "Bundle plans, products and services into named offers with pricing rules and profitability tracking.",
      icon: "Boxes",
      color: "#8b5cf6",
      status: "active",
      hasSubRoutes: true,
      blocks: [
        { blockName: "subscriptions", usage: "read", purpose: "Plan catalog used in package wizard" },
        { blockName: "products", usage: "read", purpose: "Product catalog used in package wizard" },
        { blockName: "services", usage: "read", purpose: "Service catalog used in package wizard" },
      ],
      actions: [],
      area: "transaction",
      paths: {
        page: "src/app/admin/tools/packages/",
      },
    },
    {
      kind: "tool",
      name: "pipeline",
      displayName: "Pipeline",
      description:
        "Sales pipeline management — track deals, stages, and conversion rates.",
      icon: "GitBranch",
      color: "#ef4444",
      status: "coming-soon",
      hasSubRoutes: true,
      blocks: [
        {
          blockName: "partners",
          usage: "read",
          purpose: "Partner and prospect data",
        },
        {
          blockName: "products",
          usage: "read",
          purpose: "Product catalog for deal building",
        },
      ],
      actions: [],
      area: "workflow",
      paths: {
        page: "src/app/admin/tools/pipeline/",
      },
    },
    {
      kind: "tool",
      name: "targets",
      displayName: "Targets",
      description:
        "Quota setting and tracking — define targets by rep, team, or territory.",
      icon: "Target",
      color: "#f59e0b",
      status: "coming-soon",
      hasSubRoutes: false,
      blocks: [],
      actions: [],
      area: "workflow",
      paths: {
        page: "src/app/admin/tools/targets/",
      },
    },
    {
      kind: "tool",
      name: "performance",
      displayName: "Performance",
      description:
        "Sales team performance dashboards — leaderboards, trend analysis, and forecasting.",
      icon: "TrendingUp",
      color: "#10b981",
      status: "coming-soon",
      hasSubRoutes: false,
      blocks: [],
      actions: [],
      area: "workflow",
      paths: {
        page: "src/app/admin/tools/performance/",
      },
    },
  ],
};
