import type { BlockManifest } from "../manifest";

export const perksBlock: BlockManifest = {
  name: "perks",
  displayName: "Perks",
  description:
    "Subscription tier perks — defines benefits and perks included in each subscription tier. Supports configurable sub-options (e.g., a perk that lets the member choose a variant). Full CRUD, bulk operations, import/export, and tier assignments.",
  domain: "foundation",
  types: ["perk"],
  capabilities: ["read", "create", "update", "delete", "bulk", "import", "export"],
  models: ["Perk", "PerkTierAssignment"],
  dependencies: ["tiers"],
  paths: {
    components: "src/components/perks/",
    pages: "src/app/admin/blocks/perks/",
    api: "src/app/api/perks/",
    validators: "src/lib/validators/perk.ts",
    provider: "src/lib/chat/providers/perk.provider.ts",
  },
  actions: [
    {
      name: "list_perks",
      description:
        "List all perks with optional filters for search, status, and sorting",
      method: "GET",
      endpoint: "/api/perks",
      parametersSchema: {
        type: "object",
        properties: {
          search: { type: "string" },
          status: {
            type: "string",
            enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
          },
          sort: {
            type: "string",
            enum: ["sortOrder", "name", "createdAt"],
          },
          order: { type: "string", enum: ["asc", "desc"] },
        },
      },
      responseDescription: "Array of perk objects with tier assignment counts",
    },
    {
      name: "create_perk",
      description: "Create a new perk",
      method: "POST",
      endpoint: "/api/perks",
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
          hasSubConfig: {
            type: "boolean",
            description: "Whether this perk has sub-configuration options",
          },
          subConfigLabel: { type: "string" },
          subConfigType: { type: "string" },
          subConfigOptions: {
            type: "array",
            items: { type: "string" },
          },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["name", "key"],
      },
      requiredFields: ["name", "key"],
      responseDescription: "Created perk object",
    },
    {
      name: "update_perk",
      description: "Update an existing perk by ID",
      method: "PATCH",
      endpoint: "/api/perks/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Perk UUID" },
          name: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
          },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated perk object",
    },
    {
      name: "delete_perk",
      description: "Delete a perk by ID. Confirm with user first.",
      method: "DELETE",
      endpoint: "/api/perks/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Perk UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
