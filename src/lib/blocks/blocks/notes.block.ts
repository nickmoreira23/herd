import type { BlockManifest } from "../manifest";

export const notesBlock: BlockManifest = {
  kind: "block",
  name: "notes",
  displayName: "Anotações",
  description:
    "Free-form notes with rich-text content (TipTap JSON), tags, pin/archive flags, and optional polymorphic linking to other entities (entityType + entityId). Notes can be standalone (general thoughts, briefings) or attached to a specific contact, deal, meeting, task, etc. The plain-text projection (contentText) powers search and AI retrieval.",
  types: ["note"],
  capabilities: ["read", "create", "update", "delete"],
  models: ["Note"],
  dependencies: [],
  paths: {
    components: "src/components/notes/",
    pages: "src/app/admin/blocks/notes/",
    api: "src/app/api/notes/",
    validators: "src/lib/validators/notes.ts",
    provider: "src/lib/chat/providers/note.provider.ts",
  },
  actions: [
    {
      name: "list_notes",
      description:
        "List notes with optional filters by tag, pinned, archived, linked entity (entityType+entityId), and keyword search across title and contentText",
      method: "GET",
      endpoint: "/api/notes",
      parametersSchema: {
        type: "object",
        properties: {
          tag: { type: "string" },
          pinned: { type: "string", enum: ["true", "false"] },
          archived: {
            type: "string",
            enum: ["true", "false", "all"],
            description: "Default excludes archived notes",
          },
          entityType: { type: "string" },
          entityId: { type: "string" },
          search: { type: "string" },
          limit: { type: "number" },
          offset: { type: "number" },
        },
      },
      responseDescription: "{ notes: Note[], total: number }",
    },
    {
      name: "get_note",
      description: "Get a single note by ID (includes full contentJson)",
      method: "GET",
      endpoint: "/api/notes/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Note UUID" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Single note record",
    },
    {
      name: "create_note",
      description:
        "Create a new note. Optionally link to another entity by providing both entityType and entityId together.",
      method: "POST",
      endpoint: "/api/notes",
      parametersSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          contentJson: {
            type: "object",
            description: "TipTap document JSON",
          },
          contentText: {
            type: "string",
            description: "Plain-text projection for search",
          },
          tags: { type: "array", items: { type: "string" } },
          pinned: { type: "boolean" },
          entityType: {
            type: "string",
            description: "e.g. 'contact', 'deal', 'task'",
          },
          entityId: { type: "string", description: "UUID of linked entity" },
        },
        required: ["title"],
      },
      requiredFields: ["title"],
      responseDescription: "Created note record",
    },
    {
      name: "update_note",
      description: "Update an existing note",
      method: "PATCH",
      endpoint: "/api/notes/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          contentJson: { type: "object" },
          contentText: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          pinned: { type: "boolean" },
          archived: { type: "boolean" },
          entityType: { type: "string" },
          entityId: { type: "string" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated note record",
    },
    {
      name: "delete_note",
      description: "Delete a note permanently",
      method: "DELETE",
      endpoint: "/api/notes/{id}",
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
