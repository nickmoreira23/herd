/**
 * Media processor for agent multimodal input.
 *
 * Wraps existing knowledge pipeline processors (image describer, audio/video
 * transcriber, document text extractor) into a unified interface for agent
 * conversations.
 */

import Anthropic from "@anthropic-ai/sdk";
import { describeImage } from "@/lib/images/image-describer";
import { transcribeAudio } from "@/lib/audios/audio-transcriber";
import { getVideoService } from "@/lib/foundation/video";
import { extractText } from "@/lib/documents/text-extractor";

// ─── Types ─────────────────────────────────────────────────────

export interface Attachment {
  /** "image" | "audio" | "video" | "document" */
  type: string;
  /** Public URL or local file path */
  url: string;
  /** MIME type (e.g. "image/jpeg", "audio/mp3") */
  mimeType: string;
  /** Original file name */
  fileName?: string;
}

export interface ProcessedAttachment {
  type: string;
  fileName?: string;
  /** For images: Claude Vision content block. For others: transcribed text. */
  contentBlock?: Anthropic.ImageBlockParam;
  /** Transcribed/extracted text for non-image attachments */
  text?: string;
}

// ─── MIME → Type helpers ───────────────────────────────────────

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const AUDIO_MIMES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
]);

const VIDEO_MIMES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
]);

const DOCUMENT_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
]);

export function resolveAttachmentType(mimeType: string): string | null {
  if (IMAGE_MIMES.has(mimeType)) return "image";
  if (AUDIO_MIMES.has(mimeType)) return "audio";
  if (VIDEO_MIMES.has(mimeType)) return "video";
  if (DOCUMENT_MIMES.has(mimeType)) return "document";
  return null;
}

// ─── File type from MIME ───────────────────────────────────────

function fileTypeFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
    "text/markdown": "md",
    "text/csv": "csv",
  };
  return map[mimeType] || mimeType.split("/")[1] || "unknown";
}

// ─── Process single attachment ─────────────────────────────────

/**
 * Process a single attachment into content suitable for the Anthropic API.
 *
 * - Images → Claude Vision content block (sent as image_url)
 * - Audio → Deepgram transcription text
 * - Video → Audio extraction + Deepgram transcription
 * - Documents → Text extraction (embedded text or Vision OCR)
 */
export async function processAttachment(
  attachment: Attachment
): Promise<ProcessedAttachment> {
  const type = attachment.type || resolveAttachmentType(attachment.mimeType);

  switch (type) {
    case "image": {
      // For images, create a Claude Vision content block
      const mediaType = attachment.mimeType as
        | "image/jpeg"
        | "image/png"
        | "image/gif"
        | "image/webp";

      return {
        type: "image",
        fileName: attachment.fileName,
        contentBlock: {
          type: "image",
          source: {
            type: "url",
            url: attachment.url,
          },
        },
      };
    }

    case "audio": {
      // Transcribe via Deepgram
      const localPath = urlToLocalPath(attachment.url);
      const transcript = await transcribeAudio(localPath);
      return {
        type: "audio",
        fileName: attachment.fileName,
        text: `[Audio transcript — ${attachment.fileName || "audio"}]\n${transcript}`,
      };
    }

    case "video": {
      // Extract audio + transcribe
      const localPath = urlToLocalPath(attachment.url);
      const transcript = await getVideoService().transcribeAndFormat(localPath);
      return {
        type: "video",
        fileName: attachment.fileName,
        text: `[Video transcript — ${attachment.fileName || "video"}]\n${transcript}`,
      };
    }

    case "document": {
      // Extract text from document
      const localPath = urlToLocalPath(attachment.url);
      const fileType = fileTypeFromMime(attachment.mimeType);
      const text = await extractText(localPath, fileType);
      return {
        type: "document",
        fileName: attachment.fileName,
        text: `[Document — ${attachment.fileName || "document"}]\n${text}`,
      };
    }

    default:
      return {
        type: type || "unknown",
        fileName: attachment.fileName,
        text: `[Unsupported attachment type: ${attachment.mimeType}]`,
      };
  }
}

// ─── Build Anthropic content blocks from attachments ───────────

/**
 * Process multiple attachments and build Anthropic content blocks.
 * Images become image blocks, everything else becomes text context.
 */
export async function buildMultimodalContent(
  textContent: string,
  attachments: Attachment[],
  agentAccepts: {
    acceptsImages?: boolean;
    acceptsAudio?: boolean;
    acceptsVideo?: boolean;
    acceptsDocuments?: boolean;
  }
): Promise<Anthropic.ContentBlockParam[]> {
  const blocks: Anthropic.ContentBlockParam[] = [];
  const textParts: string[] = [];

  // Process each attachment
  for (const att of attachments) {
    const type = att.type || resolveAttachmentType(att.mimeType);

    // Check agent accepts this type
    if (type === "image" && !agentAccepts.acceptsImages) {
      textParts.push(`[Image attachment rejected — agent does not accept images]`);
      continue;
    }
    if (type === "audio" && !agentAccepts.acceptsAudio) {
      textParts.push(`[Audio attachment rejected — agent does not accept audio]`);
      continue;
    }
    if (type === "video" && !agentAccepts.acceptsVideo) {
      textParts.push(`[Video attachment rejected — agent does not accept video]`);
      continue;
    }
    if (type === "document" && !agentAccepts.acceptsDocuments) {
      textParts.push(`[Document attachment rejected — agent does not accept documents]`);
      continue;
    }

    try {
      const processed = await processAttachment(att);

      if (processed.contentBlock) {
        // Image → native vision block
        blocks.push(processed.contentBlock);
      } else if (processed.text) {
        // Audio/video/document → add as text context
        textParts.push(processed.text);
      }
    } catch (err) {
      textParts.push(
        `[Failed to process ${att.fileName || att.type}: ${err instanceof Error ? err.message : "Unknown error"}]`
      );
    }
  }

  // Build final text block combining user message + attachment transcripts
  const fullText = [textContent, ...textParts].filter(Boolean).join("\n\n");
  if (fullText) {
    blocks.unshift({ type: "text", text: fullText });
  }

  return blocks.length > 0 ? blocks : [{ type: "text", text: textContent }];
}

// ─── Helpers ───────────────────────────────────────────────────

/** Convert a public URL (e.g. /uploads/knowledge/...) to a local file path */
function urlToLocalPath(url: string): string {
  // If already an absolute path, return as-is
  if (url.startsWith("/") && !url.startsWith("/uploads")) return url;

  // Convert relative URL to local path under public/
  if (url.startsWith("/uploads/")) {
    return `public${url}`;
  }

  // If it's a full URL pointing to our domain, strip the origin
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/uploads/")) {
      return `public${parsed.pathname}`;
    }
  } catch {
    // Not a URL
  }

  return url;
}
