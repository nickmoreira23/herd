import type { SolutionManifest } from "../manifest";

export const financesSolution: SolutionManifest = {
  name: "finances",
  displayName: "Finances",
  description:
    "Financial tools for revenue projections, commission payments, and operational expense management. Build P&L scenarios, track partner commissions, and manage cost scaling.",
  icon: "BarChart3",
  color: "#10b981",
  domain: "finances",
  sortOrder: 40,
  capabilities: [
    "Build and compare P&L projection scenarios",
    "Track commission payments across all partners",
    "Manage milestone-based operational expenses",
  ],
  tools: [
    {
      name: "projections",
      displayName: "Projections",
      description:
        "Build and compare P&L scenarios, model subscriber growth, and forecast revenue.",
      icon: "TrendingUp",
      color: "#10b981",
      status: "active",
      hasSubRoutes: true,
      blocks: [
        {
          blockName: "subscriptions",
          usage: "read",
          purpose: "Tier pricing for revenue modeling",
        },
        {
          blockName: "products",
          usage: "read",
          purpose: "Product COGS for cost calculations",
        },
        {
          blockName: "partners",
          usage: "read",
          purpose: "Partner data for commission calculations",
        },
      ],
      actions: [
        {
          name: "list_projections",
          description: "List all saved financial projection scenarios",
          endpoint: "/api/financial-snapshots",
          method: "GET",
          parametersSchema: { type: "object", properties: {} },
          responseDescription:
            "Array of projection snapshots with name, date, and summary metrics",
        },
        {
          name: "create_projection",
          description:
            "Create a new financial projection scenario with assumptions",
          endpoint: "/api/financial-snapshots",
          method: "POST",
          parametersSchema: {
            type: "object",
            properties: {
              scenarioName: { type: "string" },
              assumptions: { type: "object" },
            },
            required: ["scenarioName"],
          },
          requiredFields: ["scenarioName"],
          responseDescription: "Created projection snapshot",
        },
      ],
      paths: {
        page: "src/app/admin/solutions/finances/projections/",
        components: "src/components/financials/",
      },
    },
    {
      name: "payments",
      displayName: "Payments",
      description:
        "Commission payment ledger — track earned, held, released, and clawed-back entries across all partners.",
      icon: "CreditCard",
      color: "#3b82f6",
      status: "active",
      hasSubRoutes: false,
      blocks: [
        {
          blockName: "partners",
          usage: "read",
          purpose: "Partner data for commission tracking",
        },
      ],
      actions: [],
      paths: {
        page: "src/app/admin/solutions/finances/payments/",
        components: "src/components/network/promoters/tabs/",
      },
    },
    {
      name: "expenses",
      displayName: "Expenses",
      description:
        "Manage operational expense categories with milestone-based cost scaling.",
      icon: "Wallet",
      color: "#f59e0b",
      status: "active",
      hasSubRoutes: true,
      blocks: [],
      actions: [
        {
          name: "list_expense_categories",
          description:
            "List all operational expense categories with item counts",
          endpoint: "/api/opex-categories",
          method: "GET",
          parametersSchema: { type: "object", properties: {} },
          responseDescription:
            "Array of expense categories with pre-launch cost totals",
        },
      ],
      paths: {
        page: "src/app/admin/solutions/finances/expenses/",
        components: "src/components/operations/",
      },
    },
  ],
};
