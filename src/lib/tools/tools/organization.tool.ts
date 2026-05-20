import type { Tool } from "../manifest";

export const organizationTool: Tool = {
  kind: "tool",
  name: "organization",
  displayName: "Organization",
  description:
    "Institutional structure — brand kit, departments, locations, business hours, org chart, and member directory. The 'company as a whole' view.",
  icon: "Building2",
  color: "#a855f7",
  status: "active",
  hasSubRoutes: true,
  area: "identity",
  blocks: [
    {
      blockName: "companies",
      usage: "read-write",
      purpose: "Institutional metadata, brand kit, departments, locations",
    },
    {
      blockName: "contacts",
      usage: "read",
      purpose: "Member directory inside the organization",
    },
  ],
  actions: [],
  paths: {
    page: "src/app/admin/organization",
    components: "src/components/organization",
  },
};
