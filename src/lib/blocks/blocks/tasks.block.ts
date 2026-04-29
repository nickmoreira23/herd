import type { BlockManifest } from "../manifest";

export const tasksBlock: BlockManifest = {
  name: "tasks",
  displayName: "Tarefas",
  description:
    "Task management — create, list, update, and delete tasks with status (BACKLOG/TODO/IN_PROGRESS/IN_REVIEW/DONE/CANCELLED), priority, due date, assignee, project, and labels. Tasks can originate locally or be synced from external project management tools (Linear, Asana, ClickUp, Trello, etc.) via integrations using sourceIntegration/sourceId. Tasks with a sourceIntegration reflect external state and may be overwritten on the next sync.",
  domain: "operations",
  types: ["task"],
  capabilities: ["read", "create", "update", "delete", "sync"],
  models: ["Task"],
  dependencies: [],
  paths: {
    components: "src/components/tasks/",
    pages: "src/app/admin/blocks/tasks/",
    api: "src/app/api/tasks/",
    provider: "src/lib/chat/providers/task.provider.ts",
  },
  actions: [
    {
      name: "list_tasks",
      description:
        "List tasks with optional filters by status, priority, source integration, and keyword search across title/description/projectName",
      method: "GET",
      endpoint: "/api/tasks",
      parametersSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: [
              "BACKLOG",
              "TODO",
              "IN_PROGRESS",
              "IN_REVIEW",
              "DONE",
              "CANCELLED",
            ],
          },
          priority: {
            type: "string",
            enum: ["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"],
          },
          source: {
            type: "string",
            description:
              "Filter by sourceIntegration slug (e.g. 'linear', 'asana'). Use 'null' to find local-only tasks.",
          },
          search: {
            type: "string",
            description: "Keyword filter on title, description, projectName",
          },
          limit: { type: "number", description: "Max results (default 50)" },
          offset: {
            type: "number",
            description: "Pagination offset (default 0)",
          },
        },
      },
      responseDescription:
        "Object with `tasks` (array of task records) and `total` count",
    },
    {
      name: "get_task",
      description: "Get a single task by ID",
      method: "GET",
      endpoint: "/api/tasks/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Task UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Single task record",
    },
    {
      name: "create_task",
      description: "Create a new local task",
      method: "POST",
      endpoint: "/api/tasks",
      parametersSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: [
              "BACKLOG",
              "TODO",
              "IN_PROGRESS",
              "IN_REVIEW",
              "DONE",
              "CANCELLED",
            ],
            description: "Default: TODO",
          },
          priority: {
            type: "string",
            enum: ["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"],
            description: "Default: NONE",
          },
          dueDate: {
            type: "string",
            description: "ISO date string",
          },
          assignee: { type: "string", description: "Assignee display name" },
          assigneeEmail: { type: "string" },
          projectName: { type: "string" },
          labels: { type: "array", items: { type: "string" } },
        },
        required: ["title"],
      },
      requiredFields: ["title"],
      responseDescription: "Created task record",
    },
    {
      name: "update_task",
      description:
        "Update an existing task. Tasks with a non-null sourceIntegration may be overwritten on next sync — prefer updating in the source tool.",
      method: "PATCH",
      endpoint: "/api/tasks/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Task UUID" },
          title: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: [
              "BACKLOG",
              "TODO",
              "IN_PROGRESS",
              "IN_REVIEW",
              "DONE",
              "CANCELLED",
            ],
          },
          priority: {
            type: "string",
            enum: ["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"],
          },
          dueDate: { type: "string", description: "ISO date string or null" },
          assignee: { type: "string" },
          assigneeEmail: { type: "string" },
          projectName: { type: "string" },
          labels: { type: "array", items: { type: "string" } },
          completedAt: {
            type: "string",
            description: "ISO date string or null",
          },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated task record",
    },
    {
      name: "delete_task",
      description: "Delete a task",
      method: "DELETE",
      endpoint: "/api/tasks/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Task UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "{ deleted: true }",
    },
    {
      name: "sync_tasks",
      description:
        "Trigger a sync of tasks from all connected project-management integrations (Linear, Asana, ClickUp, Trello, etc.)",
      method: "POST",
      endpoint: "/api/tasks/sync",
      parametersSchema: { type: "object", properties: {} },
      responseDescription:
        "{ synced: string[] (integration slugs), errors: string[] }",
    },
  ],
};
