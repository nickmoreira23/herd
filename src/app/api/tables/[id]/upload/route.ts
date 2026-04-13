import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const table = await prisma.knowledgeTable.findUnique({ where: { id } });
  if (!table) return apiError("Table not found", 404);

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("No file provided", 400);
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return apiError(
        "Only image (JPEG, PNG, GIF, WebP, SVG) and video (MP4, WebM, MOV) files are allowed",
        400
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError("File must be under 50MB", 400);
    }

    const uploadDir = join(
      process.cwd(),
      "public",
      "uploads",
      "knowledge",
      "tables"
    );
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() || (isImage ? "png" : "mp4");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const url = `/uploads/knowledge/tables/${filename}`;
    const mediaType = isImage ? "image" : "video";

    return apiSuccess({
      url,
      filename: file.name,
      size: file.size,
      type: file.type,
      mediaType,
    });
  } catch (e) {
    console.error("POST /api/knowledge/tables/[id]/upload error:", e);
    return apiError("Failed to upload file", 500);
  }
}
