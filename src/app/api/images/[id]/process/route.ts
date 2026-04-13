import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { describeImage } from "@/lib/images/image-describer";
import { existsSync } from "fs";
import path from "path";

// Allow up to 5 minutes for large images with Vision extraction
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const image = await prisma.knowledgeImage.findUnique({ where: { id } });
  if (!image) return apiError("Not found", 404);

  // Set status to PROCESSING
  await prisma.knowledgeImage.update({
    where: { id },
    data: { status: "PROCESSING", errorMessage: null },
  });

  try {
    const filePath = path.join(process.cwd(), "public", image.fileUrl);

    if (!existsSync(filePath)) {
      throw new Error(
        `File not found on disk: ${image.fileUrl}. The file may have been moved or deleted.`
      );
    }

    const textContent = await describeImage(filePath, image.mimeType);

    const trimmed = textContent?.trim() ?? "";

    if (trimmed.length === 0) {
      const updated = await prisma.knowledgeImage.update({
        where: { id },
        data: {
          textContent: "",
          chunkCount: 0,
          status: "READY",
          processedAt: new Date(),
          errorMessage: "No description could be generated for this image.",
        },
      });
      return apiSuccess(updated);
    }

    const updated = await prisma.knowledgeImage.update({
      where: { id },
      data: {
        textContent,
        chunkCount: Math.ceil(textContent.length / 1000),
        status: "READY",
        processedAt: new Date(),
      },
    });

    return apiSuccess(updated);
  } catch (e) {
    const rawMessage = e instanceof Error ? e.message : String(e);
    const errorMessage = formatErrorMessage(rawMessage, image.fileName);

    console.error(`[Knowledge] Image processing failed for "${image.name}" (${image.id}):`, e);

    await prisma.knowledgeImage.update({
      where: { id },
      data: { status: "ERROR", errorMessage },
    });

    return apiError(errorMessage, 500);
  }
}

function formatErrorMessage(raw: string, fileName: string): string {
  if (raw.includes("ENOENT") || raw.includes("File not found")) {
    return `File not found on disk. Please re-upload "${fileName}".`;
  }
  if (raw.includes("EACCES") || raw.includes("permission")) {
    return `Permission denied when reading "${fileName}". Check file system permissions.`;
  }
  if (raw.includes("ENOMEM") || raw.includes("heap")) {
    return `"${fileName}" is too large to process in memory. Try a smaller image.`;
  }
  if (raw.includes("ANTHROPIC_API_KEY")) {
    return raw;
  }
  return `Failed to process "${fileName}": ${raw}`;
}
