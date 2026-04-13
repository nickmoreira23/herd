import type { BlockManifest } from "../manifest";

export const imagesBlock: BlockManifest = {
  name: "images",
  displayName: "Images",
  description:
    "Manage PNG, JPG, WEBP, GIF, SVG, and TIFF images. Images are processed with AI vision for automatic descriptions and OCR text extraction. Supports folder organization, dimension tracking, and status lifecycle.",
  domain: "knowledge",
  types: ["image"],
  capabilities: ["read", "create", "update", "delete", "process"],
  models: ["KnowledgeImage"],
  dependencies: [],
  paths: {
    components: "src/components/images/",
    pages: "src/app/admin/blocks/images/",
    api: "src/app/api/images/",
    validators: "src/lib/validators/images.ts",
    provider: "src/lib/chat/providers/image.provider.ts",
  },
  actions: [
    {
      name: "list_images",
      description: "List images with optional folder filter",
      method: "GET",
      endpoint: "/api/images",
      parametersSchema: {
        type: "object",
        properties: {
          folderId: { type: "string", description: "Folder UUID filter" },
        },
      },
      responseDescription: "Array of image objects with dimensions and descriptions",
    },
    {
      name: "create_image",
      description: "Create a new image record",
      method: "POST",
      endpoint: "/api/images",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          fileType: { type: "string", enum: ["PNG", "JPG", "WEBP", "GIF", "SVG", "TIFF"] },
          fileName: { type: "string" },
          fileUrl: { type: "string" },
          folderId: { type: "string" },
        },
        required: ["name", "fileType"],
      },
      requiredFields: ["name", "fileType"],
      responseDescription: "Created image object",
    },
    {
      name: "delete_image",
      description: "Delete an image and its associated data",
      method: "DELETE",
      endpoint: "/api/images/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Image UUID" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
