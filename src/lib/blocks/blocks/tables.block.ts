import type { BlockManifest } from "../manifest";

export const tablesBlock: BlockManifest = {
  name: "tables",
  displayName: "Tables",
  description:
    "Airtable-like structured data tables with 20+ field types (text, number, date, select, multiSelect, checkbox, url, email, phone, linkedRecord, formula, etc.). Supports CSV/Excel import, Airtable import, field reordering, and record management. Tables are processed and chunked for AI retrieval.",
  domain: "knowledge",
  types: ["table"],
  capabilities: ["read", "create", "update", "delete", "process", "import"],
  models: ["KnowledgeTable", "KnowledgeTableField", "KnowledgeTableRecord"],
  dependencies: [],
  paths: {
    components: "src/components/tables/",
    pages: "src/app/admin/blocks/tables/",
    api: "src/app/api/tables/",
    validators: "src/lib/validators/tables.ts",
    provider: "src/lib/chat/providers/table.provider.ts",
  },
  actions: [
    {
      name: "list_tables",
      description: "List structured data tables",
      method: "GET",
      endpoint: "/api/tables",
      parametersSchema: { type: "object", properties: {} },
      responseDescription: "Array of table objects with field and record counts",
    },
    {
      name: "create_table",
      description: "Create a new structured data table",
      method: "POST",
      endpoint: "/api/tables",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name"],
      },
      requiredFields: ["name"],
      responseDescription: "Created table object",
    },
    {
      name: "delete_table",
      description: "Delete a table and all its fields and records",
      method: "DELETE",
      endpoint: "/api/tables/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Table UUID" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
