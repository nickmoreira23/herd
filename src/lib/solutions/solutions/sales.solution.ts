import type { SolutionManifest } from "../manifest";

export const salesSolution: SolutionManifest = {
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
      paths: {
        page: "src/app/admin/solutions/sales/pipeline/",
      },
    },
    {
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
      paths: {
        page: "src/app/admin/solutions/sales/targets/",
      },
    },
    {
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
      paths: {
        page: "src/app/admin/solutions/sales/performance/",
      },
    },
  ],
};
