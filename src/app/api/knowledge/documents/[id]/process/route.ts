import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { extractText, resolveFilePath } from "@/lib/knowledge/text-extractor";
import { existsSync } from "fs";

// Allow up to 5 minutes for large PDFs with Vision extraction
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = await prisma.knowledgeDocument.findUnique({ where: { id } });
  if (!doc) return apiError("Not found", 404);

  // Set status to PROCESSING
  await prisma.knowledgeDocument.update({
    where: { id },
    data: { status: "PROCESSING", errorMessage: null },
  });

  try {
    const filePath = resolveFilePath(doc.fileUrl);

    // Verify file exists before processing
    if (!existsSync(filePath)) {
      throw new Error(
        `File not found on disk: ${doc.fileUrl}. The file may have been moved or deleted.`
      );
    }

    const textContent = await extractText(filePath, doc.fileType);

    const trimmed = textContent?.trim() ?? "";

    if (trimmed.length === 0) {
      // Still mark as READY but with a warning — the document exists, it just has no extractable text
      const updated = await prisma.knowledgeDocument.update({
        where: { id },
        data: {
          textContent: "",
          status: "READY",
          processedAt: new Date(),
          errorMessage: "No text content could be extracted from this file.",
        },
      });
      return apiSuccess(updated);
    }

    // Update with extracted text
    const updated = await prisma.knowledgeDocument.update({
      where: { id },
      data: {
        textContent,
        status: "READY",
        processedAt: new Date(),
      },
    });

    return apiSuccess(updated);
  } catch (e) {
    // Build a clear, actionable error message
    const rawMessage = e instanceof Error ? e.message : String(e);
    const errorMessage = formatErrorMessage(rawMessage, doc.fileType, doc.fileName);

    console.error(`[Knowledge] Processing failed for "${doc.name}" (${doc.id}):`, e);

    await prisma.knowledgeDocument.update({
      where: { id },
      data: { status: "ERROR", errorMessage },
    });

    return apiError(errorMessage, 500);
  }
}

/**
 * Turn raw error messages into clear, actionable descriptions.
 */
function formatErrorMessage(raw: string, fileType: string, fileName: string): string {
  // File not found
  if (raw.includes("ENOENT") || raw.includes("File not found")) {
    return `File not found on disk. Please re-upload "${fileName}".`;
  }

  // PDF-specific errors
  if (fileType === "PDF") {
    if (raw.includes("Invalid PDF") || raw.includes("bad XRef")) {
      return `"${fileName}" is not a valid PDF or is corrupted. Try re-exporting it from the original application.`;
    }
    if (raw.includes("password") || raw.includes("Password")) {
      return `"${fileName}" is password-protected. Please upload an unprotected version.`;
    }
    if (raw.includes("not a function")) {
      return `PDF processing library error. Please contact support. (${raw})`;
    }
  }

  // DOCX-specific errors
  if (fileType === "DOCX") {
    if (raw.includes("Could not find") || raw.includes("not a zip")) {
      return `"${fileName}" is not a valid DOCX file or is corrupted. Try re-saving it from Word.`;
    }
  }

  // Permission errors
  if (raw.includes("EACCES") || raw.includes("permission")) {
    return `Permission denied when reading "${fileName}". Check file system permissions.`;
  }

  // Out of memory
  if (raw.includes("ENOMEM") || raw.includes("heap")) {
    return `"${fileName}" is too large to process in memory. Try splitting it into smaller files.`;
  }

  // No text extracted
  if (raw.includes("No text could be extracted")) {
    return raw;
  }

  // Generic fallback — include the raw error for debugging
  return `Failed to process "${fileName}" (${fileType}): ${raw}`;
}
