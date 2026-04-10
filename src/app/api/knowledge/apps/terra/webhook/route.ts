import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

interface TerraWebhookPayload {
  type: string;
  status: string;
  user?: {
    user_id: string;
    provider: string;
    reference_id: string; // This is the app ID we passed as reference_id
  };
  // Data payloads (for data webhooks)
  data?: unknown[];
}

/**
 * POST — Receives Terra webhooks.
 *
 * Key event types:
 * - "auth": User completed widget auth → store Terra userId, mark connected
 * - "user_reauth": User re-authenticated
 * - "deauth": User deauthorized → mark disconnected
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TerraWebhookPayload;

    // Handle auth event — user just connected via widget
    if (payload.type === "auth" && payload.user) {
      const { user_id: terraUserId, reference_id: appId } = payload.user;

      if (!appId || !terraUserId) {
        return NextResponse.json({ status: "ignored", reason: "missing user data" });
      }

      // Verify the app exists
      const app = await prisma.knowledgeApp.findUnique({ where: { id: appId } });
      if (!app) {
        return NextResponse.json({ status: "ignored", reason: "app not found" });
      }

      // Store Terra userId as encrypted credentials
      const credentials = { terraUserId };
      await prisma.knowledgeApp.update({
        where: { id: appId },
        data: {
          credentials: encrypt(JSON.stringify(credentials)),
          status: "READY",
          connectedAt: new Date(),
          errorMessage: null,
        },
      });

      await prisma.knowledgeAppSyncLog.create({
        data: {
          appId,
          action: "connect",
          status: "success",
          details: `Apple Health connected via Terra (userId: ${terraUserId})`,
        },
      });

      return NextResponse.json({ status: "ok" });
    }

    // Handle deauth event — user revoked access
    if (payload.type === "deauth" && payload.user) {
      const { reference_id: appId } = payload.user;
      if (appId) {
        await prisma.knowledgeApp.update({
          where: { id: appId },
          data: {
            credentials: null,
            status: "PENDING",
            connectedAt: null,
            lastSyncAt: null,
            errorMessage: null,
          },
        });

        await prisma.knowledgeAppSyncLog.create({
          data: {
            appId,
            action: "disconnect",
            status: "success",
            details: "Apple Health deauthorized via Terra webhook",
          },
        });
      }

      return NextResponse.json({ status: "ok" });
    }

    // All other event types (data pushes, etc.) — acknowledge
    return NextResponse.json({ status: "ok" });
  } catch (e) {
    console.error("Terra webhook error:", e);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
