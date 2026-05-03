import type { Tool } from "../manifest";

export const networkTool: Tool = {
  kind: "tool",
  name: "network",
  displayName: "Network",
  description:
    "Network management — profiles, roles, channels, departments, and people directory. Provisional in R2; will be split in R2.5 into Organization (institutional structure) + Directory (people structure).",
  icon: "Network",
  color: "#a855f7",
  status: "active",
  hasSubRoutes: true,
  area: "identity",
  blocks: [
    {
      blockName: "contacts",
      usage: "read-write",
      purpose: "Contact directory and profile management",
    },
    {
      blockName: "companies",
      usage: "read",
      purpose: "Organizational structure data",
    },
    {
      blockName: "partners",
      usage: "read",
      purpose: "Promoter and partner network",
    },
  ],
  actions: [],
  paths: {
    page: "src/app/admin/network",
    components: "src/components/network",
  },
};
