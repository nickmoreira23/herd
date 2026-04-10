import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return apiError("No file provided", 400);
    }

    // Validate file type (images only)
    if (!file.type.startsWith("image/")) {
      return apiError("Only image files are allowed", 400);
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return apiError("File must be under 2MB", 400);
    }

    // Sanitize folder name
    const safeFolder = folder.replace(/[^a-zA-Z0-9-_]/g, "");
    const uploadDir = join(process.cwd(), "public", "uploads", safeFolder);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = file.name.split(".").pop() || "png";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const url = `/uploads/${safeFolder}/${filename}`;
    return apiSuccess({ url });
  } catch (e) {
    console.error("POST /api/upload error:", e);
    return apiError("Failed to upload file", 500);
  }
}
