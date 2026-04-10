import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import {
  getIntegrationOAuthConfig,
  getIntegrationCallbackUrl,
} from "@/lib/services/integration-oauth";
import type { IntegrationOAuthCredentials } from "@/lib/services/integration-oauth";

/**
 * GET — OAuth2 callback handler for integrations.
 * State format: "slug:integrationId"
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const baseUrl =
    process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const integrationsPageUrl = `${baseUrl}/admin/integrations`;

  if (error) {
    const errorDesc = url.searchParams.get("error_description") || error;
    return NextResponse.redirect(
      `${integrationsPageUrl}?error=${encodeURIComponent(errorDesc)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${integrationsPageUrl}?error=${encodeURIComponent("Missing code or state")}`
    );
  }

  // Parse state: "slug:integrationId" or "slug:integrationId:base64url(returnTo)"
  const stateParts = state.split(":");
  if (stateParts.length < 2) {
    return NextResponse.redirect(
      `${integrationsPageUrl}?error=${encodeURIComponent("Invalid state parameter")}`
    );
  }
  const slug = stateParts[0];
  const integrationId = stateParts[1];
  const returnTo = stateParts[2]
    ? Buffer.from(stateParts[2], "base64url").toString("utf-8")
    : null;

  try {
    const config = getIntegrationOAuthConfig(slug);
    if (!config) {
      return NextResponse.redirect(
        `${integrationsPageUrl}?error=${encodeURIComponent("Unknown integration slug")}`
      );
    }

    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${integrationsPageUrl}?error=${encodeURIComponent("OAuth credentials not configured")}`
      );
    }

    // Exchange authorization code for tokens
    // Zoom requires Basic auth header instead of body params for credentials
    const isZoom = slug === "zoom";
    const tokenHeaders: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getIntegrationCallbackUrl(),
    });

    if (isZoom) {
      tokenHeaders.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    } else {
      tokenBody.set("client_id", clientId);
      tokenBody.set("client_secret", clientSecret);
    }

    const tokenRes = await fetch(config.tokenUrl, {
      method: "POST",
      headers: tokenHeaders,
      body: tokenBody,
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      await prisma.integrationSyncLog.create({
        data: {
          integrationId,
          action: "connect",
          status: "error",
          details: `Token exchange failed (${tokenRes.status}): ${body.slice(0, 300)}`,
        },
      });
      return NextResponse.redirect(
        `${integrationsPageUrl}?error=${encodeURIComponent("Token exchange failed")}`
      );
    }

    const tokenData = await tokenRes.json();

    // Slack returns ok: true/false and access_token at top level or in authed_user
    // Slack also doesn't return refresh_token or expires_in (tokens are permanent)
    const isSlack = slug === "slack";
    if (isSlack && tokenData.ok === false) {
      await prisma.integrationSyncLog.create({
        data: {
          integrationId,
          action: "connect",
          status: "error",
          details: `Slack auth failed: ${tokenData.error || "Unknown error"}`,
        },
      });
      return NextResponse.redirect(
        `${integrationsPageUrl}?error=${encodeURIComponent(tokenData.error || "Slack auth failed")}`
      );
    }

    const credentials: IntegrationOAuthCredentials = {
      accessToken: isSlack
        ? tokenData.access_token
        : tokenData.access_token,
      refreshToken: isSlack ? null : (tokenData.refresh_token ?? null),
      expiresAt: isSlack
        ? null // Slack tokens don't expire
        : Math.floor(Date.now() / 1000) + (tokenData.expires_in ?? 3600),
    };

    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        credentials: encrypt(JSON.stringify(credentials)),
        status: "CONNECTED",
        connectedAt: new Date(),
        lastSyncError: null,
      },
    });

    await prisma.integrationSyncLog.create({
      data: {
        integrationId,
        action: "connect",
        status: "success",
        details: "OAuth connection established successfully",
      },
    });

    if (returnTo) {
      const separator = returnTo.includes("?") ? "&" : "?";
      return NextResponse.redirect(`${baseUrl}${returnTo}${separator}connected=${slug}`);
    }
    return NextResponse.redirect(
      `${integrationsPageUrl}/${integrationId}?connected=${slug}`
    );
  } catch (e) {
    console.error(`OAuth callback error for ${slug}:`, e);
    await prisma.integrationSyncLog.create({
      data: {
        integrationId,
        action: "connect",
        status: "error",
        details: e instanceof Error ? e.message : "Unknown error during OAuth callback",
      },
    }).catch(() => {});
    return NextResponse.redirect(
      `${integrationsPageUrl}?error=${encodeURIComponent("OAuth callback failed")}`
    );
  }
}
