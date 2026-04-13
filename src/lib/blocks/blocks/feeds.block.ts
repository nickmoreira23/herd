import type { BlockManifest } from "../manifest";

export const feedsBlock: BlockManifest = {
  name: "feeds",
  displayName: "Feeds",
  description:
    "RSS feed subscription with auto-sync scheduling (HOURLY, DAILY, WEEKLY). Supports keyword filtering (include/exclude), max entries per sync, and entry management. Feed entries are chunked for AI retrieval. Tracks sync history and error logs.",
  domain: "knowledge",
  types: ["rss"],
  capabilities: ["read", "create", "update", "delete", "sync"],
  models: ["KnowledgeRSSFeed", "KnowledgeRSSEntry", "KnowledgeRSSSyncLog"],
  dependencies: [],
  paths: {
    components: "src/components/feeds/",
    pages: "src/app/admin/blocks/feeds/",
    api: "src/app/api/feeds/",
    validators: "src/lib/validators/feeds.ts",
    provider: "src/lib/chat/providers/feed.provider.ts",
  },
  actions: [
    {
      name: "list_feeds",
      description: "List RSS feeds with entry counts",
      method: "GET",
      endpoint: "/api/feeds",
      parametersSchema: { type: "object", properties: {} },
      responseDescription: "Array of RSS feed objects with entry counts and sync status",
    },
    {
      name: "create_feed",
      description: "Add an RSS feed for auto-syncing",
      method: "POST",
      endpoint: "/api/feeds",
      parametersSchema: {
        type: "object",
        properties: {
          feedUrl: { type: "string", description: "RSS feed URL" },
          name: { type: "string" },
          frequency: {
            type: "string",
            enum: ["HOURLY", "DAILY", "WEEKLY"],
          },
          maxEntriesPerSync: { type: "number", description: "1-100, default 20" },
        },
        required: ["feedUrl"],
      },
      requiredFields: ["feedUrl"],
      responseDescription: "Created feed object",
    },
    {
      name: "sync_feed",
      description: "Manually trigger sync for a specific RSS feed",
      method: "POST",
      endpoint: "/api/feeds/{id}/sync",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Feed UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Sync results with new entries count",
    },
    {
      name: "delete_feed",
      description: "Delete a feed and all its entries and sync logs",
      method: "DELETE",
      endpoint: "/api/feeds/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Feed UUID" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
