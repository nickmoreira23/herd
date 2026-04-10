import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { PlaudService } from "@/lib/services/plaud";
import { writeFile, mkdir } from "fs/promises";
import type { Prisma } from "@prisma/client";
import path from "path";

const MAX_BATCH_SIZE = 5;

export async function POST(request: Request) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "plaud" },
    });
    if (!integration) return apiError("Plaud integration not found", 404);
    if (!integration.credentials) return apiError("Plaud not connected", 400);

    const creds = JSON.parse(decrypt(integration.credentials)) as {
      apiToken: string;
      region: "us" | "eu";
    };
    const svc = new PlaudService(creds.apiToken, creds.region);

    const body = await request.json();
    const fileIds: string[] = body.fileIds ?? [];
    if (fileIds.length === 0) return apiError("No file IDs provided", 400);
    if (fileIds.length > MAX_BATCH_SIZE) {
      return apiError(`Max ${MAX_BATCH_SIZE} recordings per batch`, 400);
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "knowledge",
      "audios"
    );
    await mkdir(uploadDir, { recursive: true });

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const fileId of fileIds) {
      try {
        // Check if already imported
        const existing = await prisma.knowledgeAudio.findFirst({
          where: {
            sourceIntegration: "plaud",
            sourceId: fileId,
          },
        });
        if (existing) {
          skipped++;
          continue;
        }

        // Get recording detail
        const detail = await svc.getRecordingDetail(fileId);

        // Download audio
        const audioBuffer = await svc.downloadAudio(fileId);
        const buffer = Buffer.from(audioBuffer);

        const timestamp = Date.now();
        const safeName = detail.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileName = `${timestamp}_${safeName}${safeName.endsWith(".mp3") ? "" : ".mp3"}`;
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        // Build transcript with speaker labels if available
        const textContent = detail.transcript || null;

        // Build metadata JSON with AI-generated assets
        const metadata: Record<string, unknown> = {};
        if (detail.summary) metadata.summary = detail.summary;
        if (detail.keywords?.length) metadata.keywords = detail.keywords;

        // Create KnowledgeAudio record
        await prisma.knowledgeAudio.create({
          data: {
            name: detail.filename,
            description: detail.summary || null,
            fileType: "MP3",
            fileName: detail.filename,
            fileUrl: `/uploads/knowledge/audios/${fileName}`,
            fileSize: buffer.length,
            mimeType: "audio/mpeg",
            duration: detail.duration || null,
            status: textContent ? "READY" : "PENDING",
            textContent,
            sourceIntegration: "plaud",
            sourceId: fileId,
            metadata: Object.keys(metadata).length > 0 ? (metadata as Prisma.InputJsonValue) : undefined,
            processedAt: textContent ? new Date() : null,
          },
        });

        imported++;
      } catch (err) {
        failed++;
        const message =
          err instanceof Error ? err.message : "Unknown error";
        errors.push(`${fileId}: ${message}`);
        console.error(`Plaud import error for ${fileId}:`, err);
      }
    }

    // Update last sync timestamp
    await prisma.integration.update({
      where: { slug: "plaud" },
      data: { lastSyncAt: new Date() },
    });

    return apiSuccess({ imported, skipped, failed, errors });
  } catch (e) {
    console.error("POST /api/integrations/plaud/import error:", e);
    return apiError("Failed to import recordings", 500);
  }
}
