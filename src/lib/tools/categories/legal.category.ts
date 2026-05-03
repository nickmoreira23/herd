import type { ToolCategoryManifest } from "../manifest";

export const legalCategory: ToolCategoryManifest = {
  kind: "tool_category",
  name: "legal",
  displayName: "Legal",
  description:
    "Legal tools for managing contracts, compliance documents, and program forms. Automate contract generation, track agreement status, and maintain compliance.",
  icon: "Scale",
  color: "#8b5cf6",
  domain: "legal",
  sortOrder: 10,
  capabilities: [
    "Manage legal forms and templates",
    "Generate and track contracts",
    "Maintain compliance documentation",
  ],
  tools: [
    {
      kind: "tool",
      name: "forms",
      displayName: "Forms",
      description:
        "Legal forms and templates — terms of service, waivers, and compliance documents.",
      icon: "FileText",
      color: "#8b5cf6",
      status: "active",
      hasSubRoutes: false,
      blocks: [
        {
          blockName: "forms",
          usage: "read-write",
          purpose: "Form creation and management",
        },
      ],
      actions: [],
      area: "workflow",
      paths: {
        page: "src/app/admin/tools/forms/",
      },
    },
    {
      kind: "tool",
      name: "contracts",
      displayName: "Contracts",
      description:
        "Manage partner, promoter, and program contracts — track status, renewals, and terms.",
      icon: "FileSignature",
      color: "#0ea5e9",
      status: "coming-soon",
      hasSubRoutes: true,
      blocks: [
        {
          blockName: "documents",
          usage: "read-write",
          purpose: "Contract document storage and rendering",
        },
        {
          blockName: "partners",
          usage: "read",
          purpose: "Partner data for contract generation",
        },
      ],
      agentKeys: ["contract-reviewer"],
      actions: [],
      area: "workflow",
      paths: {
        page: "src/app/admin/tools/contracts/",
      },
    },
  ],
};
