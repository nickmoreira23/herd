import type { BlockManifest } from "../manifest";

export const formsBlock: BlockManifest = {
  name: "forms",
  displayName: "Forms",
  description:
    "Form builder with sections, 15 field types (TEXT, TEXTAREA, SELECT, MULTI_SELECT, RADIO, CHECKBOX, NUMBER, DATE, EMAIL, PHONE, URL, FILE_UPLOAD, RATING, SCALE, SIGNATURE), response collection, and template system. Forms have a DRAFT → ACTIVE → CLOSED lifecycle and a public render URL at /f/[slug]. Supports access control (public, password-protected), max responses, and time windows.",
  domain: "knowledge",
  types: ["form"],
  capabilities: ["read", "create", "update", "delete", "process"],
  models: [
    "KnowledgeForm",
    "KnowledgeFormSection",
    "KnowledgeFormField",
    "KnowledgeFormResponse",
  ],
  dependencies: [],
  paths: {
    components: "src/components/forms/",
    pages: "src/app/admin/blocks/forms/",
    api: "src/app/api/forms/",
    validators: "src/lib/validators/forms.ts",
    provider: "src/lib/chat/providers/form.provider.ts",
  },
  actions: [
    {
      name: "list_forms",
      description: "List all forms with response counts",
      method: "GET",
      endpoint: "/api/forms",
      parametersSchema: { type: "object", properties: {} },
      responseDescription: "Array of form objects with response counts and status",
    },
    {
      name: "create_form",
      description: "Create a new form (starts as DRAFT)",
      method: "POST",
      endpoint: "/api/forms",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name"],
      },
      requiredFields: ["name"],
      responseDescription: "Created form object with slug",
    },
    {
      name: "delete_form",
      description: "Delete a form and all its sections, fields, and responses",
      method: "DELETE",
      endpoint: "/api/forms/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Form UUID" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
