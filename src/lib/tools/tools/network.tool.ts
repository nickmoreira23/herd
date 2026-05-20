import type { Tool } from "../manifest";

// TODO Sub-etapa 3.8: split this tool into organizationTool + profileTool (or
// equivalent). The `pages` array below references /admin/network/* which was
// deleted in Sub-etapa 3.3 — this tool is currently dangling but not crashing
// because the tools manifest is only consumed for registry registration, not
// for runtime routing. The "Network" tool concept itself is being decomposed
// because Sub-etapa 3.6+ removes the underlying MLM Network* schema.

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
  ],
  actions: [],
  paths: {
    page: "src/app/admin/network",
    components: "src/components/network",
  },
};
