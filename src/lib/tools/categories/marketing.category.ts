import type { ToolCategoryManifest } from "../manifest";

export const marketingCategory: ToolCategoryManifest = {
  kind: "tool_category",
  name: "marketing",
  displayName: "Marketing",
  description:
    "Marketing tools for campaign management, content planning, and performance analytics. Coordinate campaigns across channels, manage content calendars, and track ROI.",
  icon: "Megaphone",
  color: "#f97316",
  domain: "marketing",
  sortOrder: 20,
  capabilities: [
    "Plan and execute marketing campaigns",
    "Manage content creation and calendars",
    "Track marketing performance and ROI",
  ],
  tools: [],
};
