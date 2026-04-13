import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getImageMetadata } from "@/lib/images/image-describer";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/webp": "WEBP",
  "image/gif": "GIF",
  "image/svg+xml": "SVG",
  "image/tiff": "TIFF",
  "application/octet-stream": "", // fallback — check extension
};

const EXTENSION_TO_FILE_TYPE: Record<string, string> = {
  ".png": "PNG",
  ".jpg": "JPG",
  ".jpeg": "JPG",
  ".webp": "WEBP",
  ".gif": "GIF",
  ".svg": "SVG",
  ".tiff": "TIFF",
  ".tif": "TIFF",
};

function resolveFileType(mimeType: string, fileName: string): string | null {
  const fromMime = ALLOWED_MIME_TYPES[mimeType];
  if (fromMime) return fromMime;

  const ext = path.extname(fileName).toLowerCase();
  return EXTENSION_TO_FILE_TYPE[ext] || null;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return apiError("No file provided", 400);

  const fileType = resolveFileType(file.type, file.name);
  if (!fileType) {
    return apiError(
      "Unsupported file type. Allowed: PNG, JPG, WEBP, GIF, SVG, TIFF",
      400
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "knowledge", "images");
  await mkdir(uploadDir, { recursive: true });

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${timestamp}_${safeName}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  // Extract image dimensions
  let width: number | null = null;
  let height: number | null = null;
  try {
    const metadata = await getImageMetadata(filePath);
    width = metadata.width || null;
    height = metadata.height || null;
  } catch {
    // Non-critical — continue without dimensions
  }

  return apiSuccess({
    fileName: file.name,
    fileUrl: `/uploads/knowledge/images/${fileName}`,
    fileSize: file.size,
    mimeType: file.type,
    fileType,
    width,
    height,
  });
}
