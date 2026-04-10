import type { BlockManifest } from "../manifest";

export const communityBlock: BlockManifest = {
  name: "community",
  displayName: "Community Benefits",
  description:
    "Community benefit management — defines community access benefits (Discord servers, Slack groups, Facebook groups, etc.) that are included in subscription tiers. Supports CRUD, bulk operations, import/export, and tier assignments.",
  domain: "foundation",
  types: ["community_benefit"],
  capabilities: ["read", "create", "update", "delete", "bulk", "import", "export"],
  models: ["CommunityBenefit", "CommunityBenefitTierAssignment"],
  dependencies: ["tiers"],
  paths: {
    components: "src/components/community/",
    pages: "src/app/admin/community/",
    api: "src/app/api/community/",
    validators: "src/lib/validators/community.ts",
    provider: "src/lib/chat/providers/community.provider.ts",
  },
  actions: [
    {
      name: "list_community_benefits",
      description:
        "List all community benefits with optional status filter",
      method: "GET",
      endpoint: "/api/community",
      parametersSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
          },
        },
      },
      responseDescription: "Array of community benefit objects with tier assignment counts",
    },
    {
      name: "create_community_benefit",
      description: "Create a new community benefit",
      method: "POST",
      endpoint: "/api/community",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          key: { type: "string", description: "Unique snake_case identifier" },
          description: { type: "string" },
          longDescription: { type: "string" },
          icon: { type: "string" },
          status: {
            type: "string",
            enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
          },
          platform: {
            type: "string",
            description: "e.g. Discord, Slack, Facebook",
          },
          accessUrl: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["name", "key"],
      },
      requiredFields: ["name", "key"],
      responseDescription: "Created community benefit object",
    },
    {
      name: "update_community_benefit",
      description: "Update an existing community benefit by ID",
      method: "PATCH",
      endpoint: "/api/community/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Community benefit UUID" },
          name: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
          },
          platform: { type: "string" },
          accessUrl: { type: "string" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated community benefit object",
    },
    {
      name: "delete_community_benefit",
      description:
        "Delete a community benefit by ID. Confirm with user first.",
      method: "DELETE",
      endpoint: "/api/community/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Community benefit UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
