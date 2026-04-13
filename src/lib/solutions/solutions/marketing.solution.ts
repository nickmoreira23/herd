import type { SolutionManifest } from "../manifest";

export const marketingSolution: SolutionManifest = {
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
  tools: [
    {
      name: "campaigns",
      displayName: "Campaigns",
      description:
        "Plan, execute, and track marketing campaigns across channels.",
      icon: "Rocket",
      color: "#f97316",
      status: "coming-soon",
      hasSubRoutes: true,
      blocks: [
        {
          blockName: "events",
          usage: "read-write",
          purpose: "Campaign events and activations",
        },
        {
          blockName: "community",
          usage: "read",
          purpose: "Audience targeting and segmentation",
        },
      ],
      agentKeys: ["content-generator"],
      actions: [],
      paths: {
        page: "src/app/admin/solutions/marketing/campaigns/",
      },
    },
    {
      name: "content",
      displayName: "Content",
      description:
        "Content creation, brand guidelines, and editorial calendar management.",
      icon: "PenTool",
      color: "#ec4899",
      status: "coming-soon",
      hasSubRoutes: false,
      blocks: [
        {
          blockName: "documents",
          usage: "read-write",
          purpose: "Content document management",
        },
      ],
      agentKeys: ["content-writer"],
      actions: [],
      paths: {
        page: "src/app/admin/solutions/marketing/content/",
      },
    },
    {
      name: "analytics",
      displayName: "Analytics",
      description:
        "Marketing performance dashboards — campaign ROI, channel attribution, and conversion tracking.",
      icon: "BarChart3",
      color: "#06b6d4",
      status: "coming-soon",
      hasSubRoutes: false,
      blocks: [],
      actions: [],
      paths: {
        page: "src/app/admin/solutions/marketing/analytics/",
      },
    },
  ],
};
