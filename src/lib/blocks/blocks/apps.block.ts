import type { BlockManifest } from "../manifest";

export const appsBlock: BlockManifest = {
  name: "apps",
  displayName: "Apps",
  description:
    "External app integrations for health wearables (Oura, Whoop, Garmin, Apple Health via Terra.co) and productivity tools (Airtable, Gmail). Supports OAuth2 and API key authentication, configurable sync frequency, and 9 data categories (SLEEP, ACTIVITY, RECOVERY, HEART_RATE, WORKOUT, READINESS, BODY, NUTRITION, OTHER). Data points are chunked for AI retrieval.",
  domain: "knowledge",
  types: ["app_data"],
  capabilities: ["read", "create", "update", "delete", "sync", "process"],
  models: ["KnowledgeApp", "KnowledgeAppDataPoint", "KnowledgeAppSyncLog"],
  dependencies: ["integrations"],
  paths: {
    components: "src/components/apps/",
    pages: "src/app/admin/blocks/apps/",
    api: "src/app/api/apps/",
    validators: "src/lib/validators/apps.ts",
    provider: "src/lib/chat/providers/app.provider.ts",
  },
  actions: [
    {
      name: "list_apps",
      description: "List connected external apps",
      method: "GET",
      endpoint: "/api/apps",
      parametersSchema: { type: "object", properties: {} },
      responseDescription: "Array of app objects with connection status and sync info",
    },
    {
      name: "sync_app",
      description: "Manually trigger data sync for a connected app",
      method: "POST",
      endpoint: "/api/apps/{id}/sync",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "App UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Sync results with new data point count",
    },
    {
      name: "delete_app",
      description: "Delete an app connection and all its data points and logs",
      method: "DELETE",
      endpoint: "/api/apps/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string", description: "App UUID" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
