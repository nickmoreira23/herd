import type { BlockManifest } from "../manifest";

export const productsBlock: BlockManifest = {
  name: "products",
  displayName: "Products",
  description:
    "Product catalog management — supplements, apparel, and accessories available to members. Supports full CRUD, bulk operations (activate, deactivate, delete, price adjust), URL scraping for auto-import, CSV import, and search.",
  domain: "foundation",
  types: ["product"],
  capabilities: ["read", "create", "update", "delete", "bulk", "scrape", "import"],
  models: ["Product", "ProductImage"],
  dependencies: ["tiers", "packages"],
  paths: {
    components: "src/components/products/",
    pages: "src/app/admin/products/",
    api: "src/app/api/products/",
    lib: "src/lib/products/",
    validators: "src/lib/validators/product.ts",
    provider: "src/lib/chat/providers/product.provider.ts",
  },
  actions: [
    {
      name: "list_products",
      description:
        "List all products with optional filters for search, category, active status, and sorting",
      method: "GET",
      endpoint: "/api/products",
      parametersSchema: {
        type: "object",
        properties: {
          search: { type: "string", description: "Search by name or SKU" },
          category: {
            type: "string",
            enum: ["SUPPLEMENT", "APPAREL", "ACCESSORY"],
          },
          activeOnly: { type: "boolean" },
          sort: {
            type: "string",
            enum: ["name", "retailPrice", "memberPrice", "createdAt"],
          },
          order: { type: "string", enum: ["asc", "desc"] },
        },
      },
      responseDescription: "Array of product objects",
    },
    {
      name: "create_product",
      description: "Create a new product in the catalog",
      method: "POST",
      endpoint: "/api/products",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          sku: { type: "string" },
          category: {
            type: "string",
            enum: ["SUPPLEMENT", "APPAREL", "ACCESSORY"],
          },
          retailPrice: { type: "number" },
          costOfGoods: { type: "number" },
          memberPrice: { type: "number" },
          description: { type: "string" },
          brand: { type: "string" },
          isActive: { type: "boolean" },
          imageUrl: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["name", "sku", "category", "retailPrice", "costOfGoods"],
      },
      requiredFields: ["name", "sku", "category", "retailPrice", "costOfGoods"],
      responseDescription: "The created product object",
    },
    {
      name: "update_product",
      description: "Update an existing product by ID",
      method: "PATCH",
      endpoint: "/api/products/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Product UUID" },
          name: { type: "string" },
          sku: { type: "string" },
          category: {
            type: "string",
            enum: ["SUPPLEMENT", "APPAREL", "ACCESSORY"],
          },
          retailPrice: { type: "number" },
          memberPrice: { type: "number" },
          costOfGoods: { type: "number" },
          description: { type: "string" },
          brand: { type: "string" },
          isActive: { type: "boolean" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "The updated product object",
    },
    {
      name: "delete_product",
      description: "Delete a product by ID. This is destructive — confirm with the user first.",
      method: "DELETE",
      endpoint: "/api/products/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Product UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
    {
      name: "bulk_product_action",
      description:
        "Perform bulk action on multiple products: activate, deactivate, delete, or adjust price",
      method: "PATCH",
      endpoint: "/api/products/bulk",
      parametersSchema: {
        type: "object",
        properties: {
          ids: {
            type: "array",
            items: { type: "string" },
            description: "Array of product UUIDs",
          },
          action: {
            type: "string",
            enum: ["activate", "deactivate", "delete", "adjustPrice"],
          },
          adjustmentType: { type: "string", enum: ["percent", "fixed"] },
          adjustmentValue: { type: "number" },
        },
        required: ["ids", "action"],
      },
      requiredFields: ["ids", "action"],
      responseDescription: "Count of updated products",
    },
    {
      name: "scrape_product",
      description: "Scrape product data from a URL for preview before import",
      method: "POST",
      endpoint: "/api/products/scrape",
      parametersSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Product page URL to scrape" },
        },
        required: ["url"],
      },
      requiredFields: ["url"],
      responseDescription: "Scraped product preview data",
    },
    {
      name: "search_products",
      description: "Lightweight product search returning name, SKU, and prices (max 20 results)",
      method: "GET",
      endpoint: "/api/products/search",
      parametersSchema: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search query" },
          category: {
            type: "string",
            enum: ["SUPPLEMENT", "APPAREL", "ACCESSORY"],
          },
        },
        required: ["q"],
      },
      requiredFields: ["q"],
      responseDescription: "Lightweight product results (name, sku, prices, imageUrl)",
    },
  ],
};
