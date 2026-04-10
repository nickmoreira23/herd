import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { RecallAiService } from "@/lib/services/recall-ai";

/**
 * GET — Return Recall.ai connection status.
 */
export async function GET() {
  const integration = await prisma.integration.findUnique({
    where: { slug: "recall-ai" },
  });

  if (!integration) {
    return apiSuccess({ connected: false, status: "AVAILABLE" });
  }

  return apiSuccess({
    connected: integration.status === "CONNECTED",
    status: integration.status,
    connectedAt: integration.connectedAt,
    lastSyncAt: integration.lastSyncAt,
  });
}

/**
 * POST — Connect Recall.ai with an API key.
 * Body: { apiKey: string }
 */
export async function POST(req: NextRequest) {
  const { apiKey } = await req.json();
  if (!apiKey || typeof apiKey !== "string") {
    return apiError("API key is required", 400);
  }

  // Validate the key against Recall.ai
  const service = new RecallAiService(apiKey);
  const valid = await service.testConnection();
  if (!valid) {
    return apiError(
      "Invalid API key — could not connect to Recall.ai",
      400
    );
  }

  // Upsert the integration record
  const encrypted = encrypt(JSON.stringify({ apiKey }));
  const integration = await prisma.integration.upsert({
    where: { slug: "recall-ai" },
    create: {
      slug: "recall-ai",
      name: "Recall.ai",
      description: "AI meeting bot for recording virtual meetings",
      category: "MEETINGS",
      status: "CONNECTED",
      credentials: encrypted,
      connectedAt: new Date(),
    },
    update: {
      status: "CONNECTED",
      credentials: encrypted,
      connectedAt: new Date(),
      lastSyncError: null,
    },
  });

  return apiSuccess({ connected: true, status: integration.status });
}
