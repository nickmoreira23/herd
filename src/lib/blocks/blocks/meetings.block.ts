import type { BlockManifest } from "../manifest";

export const meetingsBlock: BlockManifest = {
  name: "meetings",
  displayName: "Meetings",
  description:
    "Meeting recording, transcription, and AI-powered insights. Supports virtual and in-person meetings with automatic transcription via Deepgram, AI summarization via Claude, action item extraction, and knowledge base integration. Integrates with Recall.ai for bot-based recording.",
  domain: "operations",
  types: ["meeting"],
  capabilities: ["read", "create", "update", "delete", "process", "summarize"],
  models: ["Meeting", "MeetingParticipant", "MeetingAgentConfig"],
  dependencies: ["events", "integrations", "knowledge"],
  paths: {
    components: "src/components/meetings/",
    pages: "src/app/admin/blocks/meetings/",
    api: "src/app/api/meetings/",
    lib: "src/lib/meetings/",
    validators: "src/lib/validators/meeting.ts",
    provider: "src/lib/chat/providers/meeting.provider.ts",
  },
  actions: [
    {
      name: "list_meetings",
      description:
        "List all meetings with stats (total, scheduled, recording, processing, ready, error counts)",
      method: "GET",
      endpoint: "/api/meetings",
      parametersSchema: { type: "object", properties: {} },
      responseDescription:
        "Object with meetings array and stats (total, scheduled, recording, processing, ready, error)",
    },
    {
      name: "create_meeting",
      description: "Create a new meeting record (virtual or in-person)",
      method: "POST",
      endpoint: "/api/meetings",
      parametersSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          meetingType: { type: "string", enum: ["VIRTUAL", "IN_PERSON"] },
          platform: {
            type: "string",
            enum: [
              "GOOGLE_MEET",
              "ZOOM",
              "MICROSOFT_TEAMS",
              "IN_PERSON",
              "OTHER",
            ],
          },
          status: {
            type: "string",
            enum: ["SCHEDULED", "RECORDING", "PROCESSING", "READY", "ERROR"],
          },
          scheduledAt: { type: "string", description: "ISO date string" },
          meetingUrl: { type: "string" },
          participants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                role: { type: "string" },
              },
            },
          },
        },
        required: ["title", "meetingType"],
      },
      requiredFields: ["title", "meetingType"],
      responseDescription: "Created meeting with participants",
    },
    {
      name: "get_meeting",
      description: "Get a single meeting by ID with full details and participants",
      method: "GET",
      endpoint: "/api/meetings/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Meeting UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Meeting with participants array",
    },
    {
      name: "update_meeting",
      description: "Update an existing meeting by ID",
      method: "PATCH",
      endpoint: "/api/meetings/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Meeting UUID" },
          title: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: ["SCHEDULED", "RECORDING", "PROCESSING", "READY", "ERROR"],
          },
          summary: { type: "string" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated meeting",
    },
    {
      name: "delete_meeting",
      description:
        "Delete a meeting by ID. This is destructive — confirm with the user first.",
      method: "DELETE",
      endpoint: "/api/meetings/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Meeting UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
    {
      name: "process_meeting",
      description:
        "Trigger processing pipeline for a meeting: download audio, transcribe, summarize, extract actions",
      method: "POST",
      endpoint: "/api/meetings/{id}/process",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Meeting UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Processing status and results",
    },
    {
      name: "summarize_meeting",
      description:
        "Generate or regenerate an AI summary for a meeting that has a transcript",
      method: "POST",
      endpoint: "/api/meetings/{id}/summarize",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Meeting UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Summary text and extracted action items",
    },
    {
      name: "get_meeting_insights",
      description: "Get aggregated meeting insights and analytics",
      method: "GET",
      endpoint: "/api/meetings/insights",
      parametersSchema: { type: "object", properties: {} },
      responseDescription: "Meeting analytics and insights data",
    },
    {
      name: "get_upcoming_meetings",
      description: "Get upcoming scheduled meetings from synced calendars",
      method: "GET",
      endpoint: "/api/meetings/upcoming",
      parametersSchema: { type: "object", properties: {} },
      responseDescription: "Array of upcoming meeting events",
    },
  ],
};
