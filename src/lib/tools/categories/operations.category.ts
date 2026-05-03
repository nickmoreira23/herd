import type { ToolCategoryManifest } from "../manifest";

export const operationsCategory: ToolCategoryManifest = {
  kind: "tool_category",
  name: "operations",
  displayName: "Operations",
  description:
    "Operational tools for running the program day-to-day — milestones, fulfillment workflows, and cross-team coordination.",
  icon: "Workflow",
  color: "#0ea5e9",
  domain: "operations",
  sortOrder: 25,
  capabilities: [
    "Define and track program milestones",
    "Coordinate operational workflows across teams",
  ],
  tools: [
    {
      kind: "tool",
      name: "milestones",
      displayName: "Milestones",
      description:
        "Program milestones — define, track and reward member progress through their journey.",
      icon: "Flag",
      color: "#f59e0b",
      status: "active",
      hasSubRoutes: false,
      blocks: [
        {
          blockName: "tasks",
          usage: "read",
          purpose: "Tasks linked to milestones",
        },
      ],
      actions: [],
      area: "workflow",
      paths: {
        page: "src/app/admin/tools/operations/milestones/",
      },
    },
  ],
};
