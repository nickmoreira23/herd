import type { BlockManifest } from "../manifest";

export const documentsBlock: BlockManifest = {
  name: "documents",
  displayName: "Documents",
  description:
    "Manage PDF, DOCX, TXT, MD, and CSV files. Documents are uploaded, processed for text extraction, and chunked for AI retrieval. Supports folder organization and status tracking (PENDING → PROCESSING → READY → ERROR).",
  domain: "knowledge",
  types: ["document"],
  capabilities: ["read", "create", "update", "delete", "process"],
  models: ["KnowledgeDocument"],
  dependencies: [],
  paths: {
    components: "src/components/documents/",
    pages: "src/app/admin/blocks/documents/",
    api: "src/app/api/documents/",
    validators: "src/lib/validators/documents.ts",
    provider: "src/lib/chat/providers/document.provider.ts",
  },
  actions: [
    {
      name: "list_documents",
      description: "List knowledge base documents with optional folder filter",
      method: "GET",
      endpoint: "/api/documents",
      parametersSchema: {
        type: "object",
        properties: {
          folderId: { type: "string", description: "Folder UUID filter" },
        },
      },
      responseDescription: "Array of document objects with stats",
    },
    {
      name: "create_document",
      description: "Create a new document record",
      method: "POST",
      endpoint: "/api/documents",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          fileType: {
            type: "string",
            enum: ["PDF", "DOCX", "TXT", "MD", "CSV"],
          },
          fileName: { type: "string" },
          fileUrl: { type: "string" },
          content: { type: "string" },
          folderId: { type: "string" },
        },
        required: ["name", "fileType"],
      },
      requiredFields: ["name", "fileType"],
      responseDescription: "Created document object",
    },
    {
      name: "delete_document",
      description: "Delete a document and its associated data",
      method: "DELETE",
      endpoint: "/api/documents/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Document UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
