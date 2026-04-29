import type { BlockManifest } from "../manifest";

const STATUS_ENUM = [
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
];

const CHANNEL_ENUM = [
  "EMAIL",
  "SOCIAL",
  "ADS",
  "EVENT",
  "CONTENT",
  "WEBINAR",
  "REFERRAL",
  "DIRECT_MAIL",
  "SMS",
  "PARTNER",
  "OTHER",
];

const OBJECTIVE_ENUM = [
  "AWARENESS",
  "ACQUISITION",
  "ACTIVATION",
  "RETENTION",
  "REVENUE",
  "REFERRAL",
  "OTHER",
];

export const campaignsBlock: BlockManifest = {
  name: "campaigns",
  displayName: "Campanhas",
  description:
    "Marketing campaigns running across one or more channels (EMAIL, SOCIAL, ADS, EVENT, CONTENT, WEBINAR, REFERRAL, DIRECT_MAIL, SMS, PARTNER, OTHER). Each campaign has a status (DRAFT/SCHEDULED/ACTIVE/PAUSED/COMPLETED/ARCHIVED), an optional objective (AWARENESS/ACQUISITION/ACTIVATION/RETENTION/REVENUE/REFERRAL/OTHER), schedule (startDate, endDate), budget vs spent in a currency, audience description, owner, free-form metrics JSON, and tags. Deals can be attributed to a campaign via Deal.campaignId; deleting a campaign sets that link to null.",
  domain: "marketing",
  types: ["campaign"],
  capabilities: ["read", "create", "update", "delete"],
  models: ["Campaign"],
  dependencies: [],
  paths: {
    components: "src/components/campaigns/",
    pages: "src/app/admin/blocks/campaigns/",
    api: "src/app/api/campaigns/",
    validators: "src/lib/validators/campaigns.ts",
    provider: "src/lib/chat/providers/campaign.provider.ts",
  },
  actions: [
    {
      name: "list_campaigns",
      description:
        "List campaigns with optional filters by status, channel, objective, ownerId, tag, and keyword search across name/description/audience/contentText",
      method: "GET",
      endpoint: "/api/campaigns",
      parametersSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: STATUS_ENUM },
          channel: { type: "string", enum: CHANNEL_ENUM },
          objective: { type: "string", enum: OBJECTIVE_ENUM },
          ownerId: { type: "string" },
          tag: { type: "string" },
          search: { type: "string" },
          limit: { type: "number" },
          offset: { type: "number" },
        },
      },
      responseDescription:
        "{ campaigns: Campaign[], total: number } — each campaign includes _count.deals",
    },
    {
      name: "get_campaign",
      description:
        "Get a single campaign by ID with up to 50 attributed deals and total deal count",
      method: "GET",
      endpoint: "/api/campaigns/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Campaign with `deals` array and `_count.deals`",
    },
    {
      name: "create_campaign",
      description: "Create a new marketing campaign",
      method: "POST",
      endpoint: "/api/campaigns",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: STATUS_ENUM },
          channels: {
            type: "array",
            items: { type: "string", enum: CHANNEL_ENUM },
          },
          objective: { type: "string", enum: OBJECTIVE_ENUM },
          startDate: { type: "string" },
          endDate: { type: "string" },
          budget: { type: "number" },
          spent: { type: "number" },
          currency: { type: "string" },
          audience: { type: "string" },
          ownerId: { type: "string" },
          metrics: { type: "object" },
          contentJson: { type: "object" },
          contentText: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["name"],
      },
      requiredFields: ["name"],
      responseDescription: "Created campaign record",
    },
    {
      name: "update_campaign",
      description: "Update a campaign",
      method: "PATCH",
      endpoint: "/api/campaigns/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: STATUS_ENUM },
          channels: {
            type: "array",
            items: { type: "string", enum: CHANNEL_ENUM },
          },
          objective: { type: "string", enum: OBJECTIVE_ENUM },
          startDate: { type: "string" },
          endDate: { type: "string" },
          budget: { type: "number" },
          spent: { type: "number" },
          currency: { type: "string" },
          audience: { type: "string" },
          ownerId: { type: "string" },
          metrics: { type: "object" },
          contentJson: { type: "object" },
          contentText: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated campaign record",
    },
    {
      name: "delete_campaign",
      description:
        "Delete a campaign. Linked deals have their campaignId set to null (onDelete: SetNull); no cascade.",
      method: "DELETE",
      endpoint: "/api/campaigns/{id}",
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
