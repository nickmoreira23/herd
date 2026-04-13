import type { BlockManifest } from "../manifest";

export const audiosBlock: BlockManifest = {
  name: "audios",
  displayName: "Audios",
  description:
    "Manage MP3, WAV, OGG, FLAC, AAC, and M4A audio files. Audio is transcribed via Deepgram with speaker labels. Supports Plaud recorder integration (auto-import with summaries and mind maps), folder organization, and AI-searchable transcripts.",
  domain: "knowledge",
  types: ["audio"],
  capabilities: ["read", "create", "update", "delete", "process", "transcribe"],
  models: ["KnowledgeAudio"],
  dependencies: [],
  paths: {
    components: "src/components/audios/",
    pages: "src/app/admin/blocks/audios/",
    api: "src/app/api/audios/",
    validators: "src/lib/validators/audios.ts",
    provider: "src/lib/chat/providers/audio.provider.ts",
  },
  actions: [
    {
      name: "list_audios",
      description: "List audio files with optional folder filter",
      method: "GET",
      endpoint: "/api/audios",
      parametersSchema: {
        type: "object",
        properties: {
          folderId: { type: "string", description: "Folder UUID filter" },
        },
      },
      responseDescription: "Array of audio objects with duration and transcript status",
    },
    {
      name: "delete_audio",
      description: "Delete an audio file and its associated data",
      method: "DELETE",
      endpoint: "/api/audios/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Audio UUID" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
