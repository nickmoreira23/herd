import { readFile } from "fs/promises";
import { resolveAnthropicKey } from "@/lib/integrations";

/**
 * Describe an image using Claude Vision API.
 *
 * Reads the image from disk, base64 encodes it, and sends it to Claude
 * with a prompt that produces a thorough textual description suitable for
 * RAG embedding and semantic search.
 */
export async function describeImage(
  filePath: string,
  mimeType: string
): Promise<string> {
  const apiKey = await resolveAnthropicKey();
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const buffer = await readFile(filePath);

  // Normalize MIME type for the API
  const validMediaTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ] as const;
  type MediaType = (typeof validMediaTypes)[number];

  // Convert SVG/TIFF to PNG via sharp for API compatibility
  let imageBuffer: Buffer = buffer;
  let mediaType: MediaType = "image/png";

  if (
    mimeType === "image/svg+xml" ||
    mimeType === "image/tiff" ||
    !validMediaTypes.includes(mimeType as MediaType)
  ) {
    const sharp = (await import("sharp")).default;
    imageBuffer = Buffer.from(await sharp(buffer).png().toBuffer());
    mediaType = "image/png";
  } else {
    mediaType = mimeType as MediaType;
  }

  const base64Image = imageBuffer.toString("base64");
  const sizeMB = imageBuffer.length / (1024 * 1024);

  console.log(
    `[Knowledge] Describing image: ${sizeMB.toFixed(2)} MB ${mediaType}`
  );

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
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: `Describe this image in thorough detail for a knowledge base. Your description will be used for search, retrieval, and providing context to AI agents.

Include:
- What the image shows (subject, scene, context)
- Any text visible in the image (transcribe it exactly)
- Colors, layout, composition, and visual style
- People, objects, logos, or brands if present
- Data visualizations (charts, graphs) — describe the data they represent
- Any relevant context or meaning that can be inferred

Be comprehensive — this description is the only textual representation of this image in our system.`,
          },
        ],
      },
    ],
  });

  const textBlocks = response.content.filter((b) => b.type === "text");
  const description = textBlocks
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");

  if (!description.trim()) {
    throw new Error(
      "Claude Vision could not generate a description for this image. " +
        "The file may be corrupted or contain no recognizable visual content."
    );
  }

  return description;
}

/**
 * Extract image dimensions using sharp.
 */
export async function getImageMetadata(
  filePath: string
): Promise<{ width: number; height: number }> {
  const sharp = (await import("sharp")).default;
  const metadata = await sharp(filePath).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}
