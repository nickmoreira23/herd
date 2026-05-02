import type { BlockManifest } from "../manifest";

export const servicesBlock: BlockManifest = {
  kind: "block",
  name: "services",
  displayName: "Serviços",
  description:
    "Catalog of services offered by the company — consulting, training, support, mentoring, etc. Each service has a unique slug `key` (for tier/package referencing), a short `description`, rich-text long content (TipTap), category, duration, price + pricingType (FIXED/HOURLY/DAILY/MONTHLY/CUSTOM), icon, status (DRAFT/ACTIVE/ARCHIVED), sortOrder, and tags. Follows the same structural pattern as Perks/CommunityBenefits to be referenceable from SubscriptionTiers and Packages in the future via a join table (e.g., ServiceTierAssignment).",
  types: ["service"],
  capabilities: ["read", "create", "update", "delete"],
  models: ["Service"],
  dependencies: [],
  paths: {
    components: "src/components/services/",
    pages: "src/app/admin/blocks/services/",
    api: "src/app/api/services/",
    validators: "src/lib/validators/services.ts",
    provider: "src/lib/chat/providers/service.provider.ts",
  },
  actions: [
    {
      name: "list_services",
      description:
        "List services with optional filters by category, status, pricingType, and keyword search across name/key/description/contentText/category",
      method: "GET",
      endpoint: "/api/services",
      parametersSchema: {
        type: "object",
        properties: {
          category: { type: "string" },
          status: {
            type: "string",
            enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
          },
          pricingType: {
            type: "string",
            enum: ["FIXED", "HOURLY", "DAILY", "MONTHLY", "CUSTOM"],
          },
          search: { type: "string" },
          limit: { type: "number" },
          offset: { type: "number" },
        },
      },
      responseDescription: "{ services: Service[], total: number }",
    },
    {
      name: "get_service",
      description: "Get a single service by ID",
      method: "GET",
      endpoint: "/api/services/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Single service record",
    },
    {
      name: "create_service",
      description:
        "Create a new service. If `key` is omitted, server slugifies `name` and ensures uniqueness by appending a numeric suffix on collision.",
      method: "POST",
      endpoint: "/api/services",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          key: { type: "string", description: "Unique slug (auto-generated if omitted)" },
          description: { type: "string", description: "Short summary" },
          contentJson: { type: "object", description: "TipTap document JSON" },
          contentText: { type: "string", description: "Plain-text projection" },
          category: { type: "string" },
          duration: { type: "string" },
          price: { type: "number", description: "Decimal — ignored if pricingType is CUSTOM" },
          pricingType: {
            type: "string",
            enum: ["FIXED", "HOURLY", "DAILY", "MONTHLY", "CUSTOM"],
          },
          imageUrl: { type: "string" },
          icon: { type: "string", description: "Lucide icon name" },
          status: {
            type: "string",
            enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
          },
          sortOrder: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["name"],
      },
      requiredFields: ["name"],
      responseDescription: "Created service record",
    },
    {
      name: "update_service",
      description:
        "Update an existing service. If `key` changes, the new value must not collide with another service.",
      method: "PATCH",
      endpoint: "/api/services/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          key: { type: "string" },
          description: { type: "string" },
          contentJson: { type: "object" },
          contentText: { type: "string" },
          category: { type: "string" },
          duration: { type: "string" },
          price: { type: "number" },
          pricingType: {
            type: "string",
            enum: ["FIXED", "HOURLY", "DAILY", "MONTHLY", "CUSTOM"],
          },
          imageUrl: { type: "string" },
          icon: { type: "string" },
          status: {
            type: "string",
            enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
          },
          sortOrder: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated service record",
    },
    {
      name: "delete_service",
      description: "Delete a service permanently",
      method: "DELETE",
      endpoint: "/api/services/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "{ deleted: true }",
    },
  ],
};
