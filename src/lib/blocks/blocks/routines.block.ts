import type { BlockManifest } from "../manifest";

const TRIGGER_ENUM = ["MANUAL", "SCHEDULE", "EVENT"];
const STATUS_ENUM = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"];

export const routinesBlock: BlockManifest = {
  name: "routines",
  displayName: "Routines",
  description:
    "Automations executed by agents. Each routine binds an agent to a trigger (MANUAL, SCHEDULE via cron expression, or EVENT from another block) plus a prompt template and inputs. The system records every execution as a RoutineRun (QUEUED → RUNNING → SUCCESS|FAILED|CANCELLED) with full input/output/error/usage. Lives in the Automation category and depends on the Agents block.",
  domain: "operations",
  types: ["routine"],
  capabilities: ["read", "create", "update", "delete"],
  models: ["Routine", "RoutineRun"],
  dependencies: ["agents"],
  paths: {
    components: "src/components/routines/",
    pages: "src/app/admin/blocks/routines/",
    api: "src/app/api/routines/",
    validators: "src/lib/validators/routines.ts",
    provider: "src/lib/chat/providers/routine.provider.ts",
  },
  actions: [
    {
      name: "list_routines",
      description:
        "List routines with optional filters by status, triggerType, agentId, tag and keyword search.",
      method: "GET",
      endpoint: "/api/routines",
      parametersSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: STATUS_ENUM },
          triggerType: { type: "string", enum: TRIGGER_ENUM },
          agentId: { type: "string" },
          tag: { type: "string" },
          search: { type: "string" },
          limit: { type: "number" },
          offset: { type: "number" },
        },
      },
      responseDescription:
        "{ routines: Routine[], total: number } — each routine includes the bound agent and `_count.runs`.",
    },
    {
      name: "get_routine",
      description: "Get a single routine by ID with the last 50 runs.",
      method: "GET",
      endpoint: "/api/routines/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Routine with `agent`, `runs[]`, `_count.runs`",
    },
    {
      name: "create_routine",
      description:
        "Create a new routine. For SCHEDULE triggers, `cronExpression` is validated and `nextRunAt` is computed; for EVENT triggers, `eventBlock` and `eventType` are required.",
      method: "POST",
      endpoint: "/api/routines",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          promptTemplate: { type: "string" },
          status: { type: "string", enum: STATUS_ENUM },
          agentId: { type: "string" },
          triggerType: { type: "string", enum: TRIGGER_ENUM },
          cronExpression: { type: "string" },
          timezone: { type: "string" },
          eventBlock: { type: "string" },
          eventType: { type: "string" },
          eventFilter: { type: "object" },
          inputSchema: { type: "object" },
          defaultInputs: { type: "object" },
          outputFormat: {
            type: "string",
            enum: ["text", "json", "markdown"],
          },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["name", "promptTemplate", "agentId", "triggerType"],
      },
      requiredFields: ["name", "promptTemplate", "agentId", "triggerType"],
      responseDescription: "Created routine record",
    },
    {
      name: "update_routine",
      description:
        "Update a routine. Changes to `cronExpression`, `timezone`, `triggerType` or `status` recompute `nextRunAt`.",
      method: "PATCH",
      endpoint: "/api/routines/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated routine record",
    },
    {
      name: "delete_routine",
      description: "Delete a routine and cascade its runs.",
      method: "DELETE",
      endpoint: "/api/routines/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "{ deleted: true }",
    },
    {
      name: "run_routine",
      description:
        "Run a routine right now. Synchronous: creates a RoutineRun with triggerSource=MANUAL and returns it after the agent finishes.",
      method: "POST",
      endpoint: "/api/routines/{id}/run",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          input: { type: "object" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription:
        "Final RoutineRun (status SUCCESS or FAILED) with output/error/usage.",
    },
    {
      name: "pause_routine",
      description: "Pause a routine. Clears nextRunAt; SCHEDULE will not fire.",
      method: "POST",
      endpoint: "/api/routines/{id}/pause",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated routine with status=PAUSED",
    },
    {
      name: "resume_routine",
      description:
        "Resume a routine. Recomputes nextRunAt for SCHEDULE triggers.",
      method: "POST",
      endpoint: "/api/routines/{id}/resume",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated routine with status=ACTIVE",
    },
    {
      name: "list_routine_runs",
      description: "List execution history for a routine, newest first.",
      method: "GET",
      endpoint: "/api/routines/{id}/runs",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: {
            type: "string",
            enum: ["QUEUED", "RUNNING", "SUCCESS", "FAILED", "CANCELLED"],
          },
          limit: { type: "number" },
          offset: { type: "number" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "{ runs: RoutineRun[], total: number }",
    },
  ],
};
