import type { BlockManifest } from "../manifest";

export const agentsBlock: BlockManifest = {
  name: "agents",
  displayName: "AI Agents",
  description:
    "AI agent configuration and management — define LLM-powered agents with custom system prompts, model settings, skills, tools, and knowledge items. Agents are linked to subscription tiers for access control. Supports CRUD, bulk operations, import/export, and sub-resource management for skills, tools, and knowledge.",
  domain: "foundation",
  types: ["agent"],
  capabilities: ["read", "create", "update", "delete", "bulk", "import", "export"],
  models: ["Agent", "AgentSkill", "AgentTool", "AgentKnowledgeItem", "AgentTierAccess"],
  dependencies: ["tiers", "knowledge"],
  paths: {
    components: "src/components/agents/",
    pages: "src/app/admin/agents/",
    api: "src/app/api/agents/",
    validators: "src/lib/validators/agent.ts",
    provider: "src/lib/chat/providers/agent.provider.ts",
  },
  actions: [
    {
      name: "list_agents",
      description:
        "List all AI agents with optional filters for search, category, status, and sorting",
      method: "GET",
      endpoint: "/api/agents",
      parametersSchema: {
        type: "object",
        properties: {
          search: { type: "string", description: "Search by name or description" },
          category: {
            type: "string",
            enum: ["NUTRITION", "TRAINING", "RECOVERY", "COACHING", "ANALYTICS"],
          },
          status: {
            type: "string",
            enum: ["DRAFT", "ACTIVE", "BETA", "DEPRECATED"],
          },
          sort: {
            type: "string",
            enum: ["sortOrder", "name", "createdAt"],
          },
          order: { type: "string", enum: ["asc", "desc"] },
        },
      },
      responseDescription: "Array of agent objects with tier access counts",
    },
    {
      name: "create_agent",
      description: "Create a new AI agent with model config and system prompt",
      method: "POST",
      endpoint: "/api/agents",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          key: {
            type: "string",
            description: "Unique snake_case identifier",
          },
          category: {
            type: "string",
            enum: ["NUTRITION", "TRAINING", "RECOVERY", "COACHING", "ANALYTICS"],
          },
          description: { type: "string" },
          longDescription: { type: "string" },
          icon: { type: "string" },
          status: {
            type: "string",
            enum: ["DRAFT", "ACTIVE", "BETA", "DEPRECATED"],
          },
          modelProvider: { type: "string" },
          modelId: { type: "string" },
          systemPrompt: { type: "string" },
          temperature: { type: "number" },
          maxTokens: { type: "number" },
          isConversational: { type: "boolean" },
        },
        required: ["name", "key"],
      },
      requiredFields: ["name", "key"],
      responseDescription: "Created agent object",
    },
    {
      name: "update_agent",
      description: "Update an existing AI agent by ID",
      method: "PATCH",
      endpoint: "/api/agents/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Agent UUID" },
          name: { type: "string" },
          description: { type: "string" },
          systemPrompt: { type: "string" },
          status: {
            type: "string",
            enum: ["DRAFT", "ACTIVE", "BETA", "DEPRECATED"],
          },
          temperature: { type: "number" },
          maxTokens: { type: "number" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated agent object",
    },
    {
      name: "delete_agent",
      description:
        "Delete an AI agent by ID. Cascades to skills, tools, knowledge items, and tier access. Confirm with user first.",
      method: "DELETE",
      endpoint: "/api/agents/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Agent UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
    {
      name: "get_agent",
      description: "Get a single AI agent by ID with all relations (skills, tools, knowledge, tier access)",
      method: "GET",
      endpoint: "/api/agents/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Agent UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Agent with skills, tools, knowledge items, and tier access",
    },
  ],
};
