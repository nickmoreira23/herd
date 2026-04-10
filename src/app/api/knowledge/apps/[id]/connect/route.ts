import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { encrypt } from "@/lib/encryption";
import { getOAuthConfig, getCallbackUrl } from "@/lib/knowledge/app-config";

/**
 * Encrypt credentials, falling back to plain JSON if ENCRYPTION_KEY is not set (dev only).
 */
function encryptCredentials(data: string): string {
  try {
    return encrypt(data);
  } catch {
    if (process.env.NODE_ENV === "development") return data;
    throw new Error("ENCRYPTION_KEY is required in production");
  }
}

/**
 * POST — Connect an app using a manually-provided access token, or generate an OAuth URL.
 *
 * Body (optional): { accessToken: string }
 *   - If provided, stores the token directly and marks the app connected.
 *   - If omitted, falls back to the OAuth authorization URL flow.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const app = await prisma.knowledgeApp.findUnique({ where: { id } });
    if (!app) return apiError("App not found", 404);

    // ── Try to read a manually-provided token from the body ──
    let body: { accessToken?: string } = {};
    try {
      body = await request.json();
    } catch {
      // No body or invalid JSON — continue to OAuth flow
    }

    if (body.accessToken && body.accessToken.trim()) {
      const credentials = {
        accessToken: body.accessToken.trim(),
        refreshToken: null,
        expiresAt: null, // PATs don't expire via OAuth refresh
        manualEntry: true,
      };

      await prisma.knowledgeApp.update({
        where: { id },
        data: {
          credentials: encryptCredentials(JSON.stringify(credentials)),
          status: "READY",
          connectedAt: new Date(),
          errorMessage: null,
        },
      });

      await prisma.knowledgeAppSyncLog.create({
        data: {
          appId: id,
          action: "connect",
          status: "success",
          details: `Connected via personal access token`,
        },
      });

      return apiSuccess({ connected: true });
    }

    // ── Apple Health uses Terra widget, not OAuth ──
    if (app.slug === "apple-health") {
      return apiError("Apple Health uses the Terra widget endpoint (/terra/widget)", 400);
    }

    // ── OAuth flow ──
    const config = getOAuthConfig(app.slug);
    if (!config) return apiError(`No OAuth config for app: ${app.slug}`, 400);

    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];

    if (!clientId || !clientSecret) {
      return apiError(
        `OAuth not configured. Use a personal access token to connect, or add ${config.clientIdEnv} and ${config.clientSecretEnv} to your .env file.`,
        400
      );
    }

    // Real OAuth flow — generate auth URL
    const callbackUrl = getCallbackUrl(app.slug);

    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("scope", config.scopes.join(" "));
    authUrl.searchParams.set("state", app.id);

    return apiSuccess({ authUrl: authUrl.toString() });
  } catch (e) {
    console.error("POST /api/knowledge/apps/[id]/connect error:", e);
    return apiError("Failed to connect app", 500);
  }
}

/**
 * DELETE — Disconnect the app. Clears credentials and resets status.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await prisma.knowledgeApp.update({
      where: { id },
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
        appId: id,
        action: "disconnect",
        status: "success",
        details: "App disconnected — credentials cleared",
      },
    });

    return apiSuccess({ id: updated.id, status: updated.status });
  } catch (e) {
    console.error("DELETE /api/knowledge/apps/[id]/connect error:", e);
    return apiError("Failed to disconnect app", 500);
  }
}
