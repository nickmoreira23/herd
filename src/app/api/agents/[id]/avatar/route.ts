import { NextRequest } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "agents");
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("No file provided", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Invalid file type. Allowed: PNG, JPG, WebP, SVG, GIF", 400);
    }

    if (file.size > MAX_SIZE) {
      return apiError("File too large. Max 2 MB.", 400);
    }

    // Verify agent exists
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      return apiError("Agent not found", 404);
    }

    // Delete old uploaded file if exists
    if (agent.iconUrl) {
      const oldPath = path.join(process.cwd(), "public", agent.iconUrl);
      try { await unlink(oldPath); } catch { /* ignore */ }
    }

    // Save file
    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = file.name.split(".").pop() || "png";
    const filename = `${id}-${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const iconUrl = `/uploads/agents/${filename}`;

    // Update agent
    const updated = await prisma.agent.update({
      where: { id },
      data: { iconUrl },
    });

    return apiSuccess({ iconUrl: updated.iconUrl });
  } catch (e) {
    console.error("Avatar upload error:", e);
    return apiError("Upload failed", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      return apiError("Agent not found", 404);
    }

    if (agent.iconUrl) {
      const oldPath = path.join(process.cwd(), "public", agent.iconUrl);
      try { await unlink(oldPath); } catch { /* ignore */ }
    }

    await prisma.agent.update({
      where: { id },
      data: { iconUrl: null },
    });

    return apiSuccess({ iconUrl: null });
  } catch (e) {
    console.error("Avatar delete error:", e);
    return apiError("Delete failed", 500);
  }
}
