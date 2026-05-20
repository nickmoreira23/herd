import type { Tool } from "../manifest";

export const chatTool: Tool = {
  kind: "tool",
  name: "chat",
  displayName: "Chat",
  description:
    "Conversational AI interface for interacting with the platform. Orchestrates agents, retrieves data via search, and executes actions across blocks.",
  icon: "MessageSquare",
  color: "#3b82f6",
  status: "active",
  hasSubRoutes: true,
  area: "communication",
  blocks: [
    {
      blockName: "contacts",
      usage: "read",
      purpose: "Identify conversation participants and context",
    },
    {
      blockName: "agents",
      usage: "read",
      purpose: "Resolve which agent handles the conversation",
    },
    {
      blockName: "documents",
      usage: "read",
      purpose: "Context retrieval from documents during conversation",
    },
  ],
  agentKeys: ["primary-orchestrator"],
  actions: [],
  paths: {
    page: "src/app/admin/chat",
    components: "src/components/chat",
    api: "src/app/api/chat",
  },
};
