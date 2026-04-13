import type { BlockManifest } from "../manifest";

export const linksBlock: BlockManifest = {
  name: "links",
  displayName: "Links",
  description:
    "Web link scraping with two modes: SINGLE page scrape or FULL_SITE crawl. Crawls respect depth limits and max pages (1-1000). Scraped content is chunked for AI retrieval. Tracks discovered, scraped, and errored page counts. Supports sitemap parsing and link extraction.",
  domain: "knowledge",
  types: ["link"],
  capabilities: ["read", "create", "update", "delete", "scrape", "crawl"],
  models: ["KnowledgeLink", "KnowledgeLinkPage"],
  dependencies: [],
  paths: {
    components: "src/components/links/",
    pages: "src/app/admin/blocks/links/",
    api: "src/app/api/links/",
    validators: "src/lib/validators/links.ts",
    provider: "src/lib/chat/providers/link.provider.ts",
  },
  actions: [
    {
      name: "list_links",
      description: "List web links with page counts",
      method: "GET",
      endpoint: "/api/links",
      parametersSchema: { type: "object", properties: {} },
      responseDescription: "Array of link objects with scrape status and page counts",
    },
    {
      name: "create_link",
      description: "Add a web link for scraping",
      method: "POST",
      endpoint: "/api/links",
      parametersSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to scrape" },
          name: { type: "string" },
          scrapeMode: {
            type: "string",
            enum: ["SINGLE", "FULL_SITE"],
            description: "SINGLE for one page, FULL_SITE to crawl the whole site",
          },
          maxPages: {
            type: "number",
            description: "Max pages to crawl (1-1000, default 100)",
          },
        },
        required: ["url"],
      },
      requiredFields: ["url"],
      responseDescription: "Created link object",
    },
    {
      name: "delete_link",
      description: "Delete a link and all its scraped pages",
      method: "DELETE",
      endpoint: "/api/links/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Link UUID" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
