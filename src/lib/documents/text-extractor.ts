import { readFile } from "fs/promises";
import path from "path";
import { resolveAnthropicKey } from "@/lib/integrations";

/**
 * Extract plain text from a knowledge document file.
 *
 * For PDFs: tries embedded text first (fast, free). If the PDF is image-based
 * (slides, scans), falls back to Claude Vision API for OCR-quality extraction.
 * Each page is rendered to a compressed JPEG image before sending to ensure
 * even large image-heavy PDFs work within API size limits.
 *
 * Supports: PDF, DOCX, TXT, MD, CSV
 */
export async function extractText(filePath: string, fileType: string): Promise<string> {
  switch (fileType) {
    case "PDF":
      return extractPdf(filePath);
    case "DOCX":
      return extractDocx(filePath);
    case "TXT":
    case "MD":
    case "CSV":
      return readFile(filePath, "utf-8");
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * PDF extraction with smart fallback:
 * 1. Try pdf-parse for embedded text (fast, free)
 * 2. If little/no text found, render pages to images and use Claude Vision API
 */
async function extractPdf(filePath: string): Promise<string> {
  // Step 1: Try fast embedded text extraction
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
    buf: Buffer
  ) => Promise<{ text: string; numpages: number }>;

  const buffer = await readFile(filePath);
  const parsed = await pdfParse(buffer);

  const embeddedText = parsed.text.trim();

  // If we got meaningful text (> 50 chars per page avg), use it
  const avgCharsPerPage = embeddedText.length / Math.max(parsed.numpages, 1);
  if (avgCharsPerPage > 50) {
    return embeddedText;
  }

  // Step 2: Image-based PDF — render pages to images and use Claude Vision API
  console.log(
    `[Knowledge] PDF has ${embeddedText.length} chars across ${parsed.numpages} pages (avg ${Math.round(avgCharsPerPage)}/page). Using Claude Vision for extraction.`
  );

  return extractPdfWithVision(buffer, parsed.numpages);
}

/**
 * Extract text from a PDF by rendering each page to a compressed JPEG image
 * and sending it to Claude's Vision API. This approach handles PDFs of any size
 * because images are compressed to well under API limits.
 */
async function extractPdfWithVision(
  pdfBuffer: Buffer,
  pageCount: number
): Promise<string> {
  const apiKey = await resolveAnthropicKey();

  // Dynamic imports for ESM-only modules
  const { pdf } = await import("pdf-to-img");
  const sharp = (await import("sharp")).default;
  const Anthropic = (await import("@anthropic-ai/sdk")).default;

  const client = new Anthropic({ apiKey });
  const allText: string[] = [];

  console.log(
    `[Knowledge] Rendering ${pageCount} PDF pages to images for Vision extraction...`
  );

  // Render all pages to images using pdf-to-img
  const document = await pdf(pdfBuffer, { scale: 1.5 });
  let pageIndex = 0;

  for await (const pngImage of document) {
    pageIndex++;
    console.log(`[Knowledge] Processing page ${pageIndex} of ${pageCount}...`);

    try {
      // Compress PNG to JPEG for smaller payload
      const jpegBuffer = await sharp(pngImage).jpeg({ quality: 75 }).toBuffer();
      const base64Image = jpegBuffer.toString("base64");
      const sizeMB = jpegBuffer.length / (1024 * 1024);

      console.log(
        `[Knowledge] Page ${pageIndex}: ${sizeMB.toFixed(2)} MB JPEG`
      );

      // Send to Claude Vision as an image
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: `Extract ALL text content from page ${pageIndex} of this document. Include headings, body text, bullet points, captions, labels, and any other readable text. Preserve the document structure using markdown formatting (headings, lists, etc.). Do not describe images — only extract text that appears in the document. If the page has no text, write "[No text on this page]".`,
              },
            ],
          },
        ],
      });

      const textBlocks = response.content.filter(
        (b) => b.type === "text"
      );
      const pageText = textBlocks
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("\n");
      allText.push(pageText);
    } catch (pageError) {
      const msg =
        pageError instanceof Error ? pageError.message : String(pageError);
      console.error(
        `[Knowledge] Failed to extract page ${pageIndex}: ${msg}`
      );
      allText.push(`[Error extracting page ${pageIndex}: ${msg}]`);
    }
  }

  const combined = allText.join("\n\n---\n\n");

  if (combined.trim().length === 0) {
    throw new Error(
      "Claude Vision could not extract any text from this PDF. " +
        "The file may be corrupted or contain only non-text visual elements."
    );
  }

  return combined;
}

async function extractDocx(filePath: string): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

/**
 * Resolve the absolute file path from a document's fileUrl.
 * fileUrl is relative to /public, e.g. "/uploads/knowledge/123_file.pdf"
 */
export function resolveFilePath(fileUrl: string): string {
  return path.join(process.cwd(), "public", fileUrl);
}
