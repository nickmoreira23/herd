import type { BlockManifest } from "../manifest";

export const videosBlock: BlockManifest = {
  name: "videos",
  displayName: "Videos",
  description:
    "Manage MP4, MOV, WEBM, and AVI video files. Videos are transcribed with speaker labels and have thumbnails extracted. Supports folder organization, duration tracking, and AI-searchable transcripts.",
  domain: "knowledge",
  types: ["video"],
  capabilities: ["read", "create", "update", "delete", "process", "transcribe"],
  models: ["KnowledgeVideo"],
  dependencies: [],
  paths: {
    components: "src/components/videos/",
    pages: "src/app/admin/blocks/videos/",
    api: "src/app/api/videos/",
    validators: "src/lib/validators/videos.ts",
    provider: "src/lib/chat/providers/video.provider.ts",
  },
  actions: [
    {
      name: "list_videos",
      description: "List videos with optional folder filter",
      method: "GET",
      endpoint: "/api/videos",
      parametersSchema: {
        type: "object",
        properties: {
          folderId: { type: "string", description: "Folder UUID filter" },
        },
      },
      responseDescription: "Array of video objects with duration and transcript status",
    },
    {
      name: "delete_video",
      description: "Delete a video and its associated data",
      method: "DELETE",
      endpoint: "/api/videos/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Video UUID" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
