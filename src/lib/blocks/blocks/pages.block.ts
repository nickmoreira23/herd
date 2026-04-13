import type { BlockManifest } from "../manifest";

export const pagesBlock: BlockManifest = {
  name: "pages",
  displayName: "Pages",
  description:
    "Landing page builder — create, edit, and publish marketing and informational pages with a visual editor. Supports sections, components, versioning, SEO settings, custom styles, and publishing workflow (draft → published → archived).",
  domain: "operations",
  types: ["landing-page"],
  capabilities: ["read", "create", "update", "delete"],
  models: ["LandingPage", "LandingPageVersion", "LandingPageSection"],
  dependencies: [],
  paths: {
    components: "src/components/landing-page/",
    pages: "src/app/admin/blocks/pages/",
    api: "src/app/api/landing-pages/",
    validators: "src/lib/validators/landing-page.ts",
    provider: "src/lib/chat/providers/landing-page.provider.ts",
  },
  actions: [
    {
      name: "list_pages",
      description: "List all landing pages with optional status filter",
      method: "GET",
      endpoint: "/api/landing-pages",
      parametersSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
            description: "Filter by page status",
          },
        },
      },
      responseDescription: "Array of landing page objects with name, slug, status, dates",
    },
    {
      name: "get_page",
      description: "Get a single landing page by ID with full details",
      method: "GET",
      endpoint: "/api/landing-pages/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Landing page UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Single landing page with all fields including SEO and styles",
    },
    {
      name: "create_page",
      description: "Create a new landing page with a name and URL slug",
      method: "POST",
      endpoint: "/api/landing-pages",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Page display name (1-100 chars)" },
          slug: {
            type: "string",
            description: "URL slug (lowercase, hyphens only, 1-100 chars)",
          },
          description: {
            type: "string",
            description: "Optional page description (max 500 chars)",
          },
        },
        required: ["name", "slug"],
      },
      requiredFields: ["name", "slug"],
      responseDescription: "Created landing page object",
    },
    {
      name: "update_page",
      description:
        "Update a landing page's name, slug, status, SEO settings, or styles",
      method: "PATCH",
      endpoint: "/api/landing-pages/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Landing page UUID" },
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
          seoTitle: { type: "string", description: "SEO title (max 70 chars)" },
          seoDescription: {
            type: "string",
            description: "SEO meta description (max 160 chars)",
          },
          seoImage: { type: "string", description: "SEO image URL" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated landing page object",
    },
    {
      name: "delete_page",
      description: "Delete a landing page and all its sections/versions permanently",
      method: "DELETE",
      endpoint: "/api/landing-pages/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Landing page UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
