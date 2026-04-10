import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { getOAuthConfig, getCallbackUrl } from "@/lib/knowledge/app-config";
import type { StoredCredentials } from "@/lib/knowledge/token-refresh";

/**
 * GET — OAuth2 callback handler.
 * Exchanges the authorization code for tokens, encrypts and stores them,
 * then redirects back to the apps page.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // app ID
  const error = url.searchParams.get("error");

  const appsPageUrl =
    (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") +
    "/admin/organization/knowledge/apps";

  // Handle OAuth error (user denied, etc.)
  if (error) {
    const errorDesc = url.searchParams.get("error_description") || error;
    if (state) {
      await prisma.knowledgeAppSyncLog.create({
        data: {
          appId: state,
          action: "connect",
          status: "error",
          details: `OAuth error: ${errorDesc}`,
        },
      }).catch(() => {}); // Don't fail the redirect if logging fails
    }
    return NextResponse.redirect(`${appsPageUrl}?error=${encodeURIComponent(errorDesc)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appsPageUrl}?error=${encodeURIComponent("Missing code or state")}`);
  }

  try {
    const config = getOAuthConfig(slug);
    if (!config) {
      return NextResponse.redirect(`${appsPageUrl}?error=${encodeURIComponent("Unknown app slug")}`);
    }

    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${appsPageUrl}?error=${encodeURIComponent("OAuth credentials not configured")}`
      );
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: getCallbackUrl(slug),
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      await prisma.knowledgeAppSyncLog.create({
        data: {
          appId: state,
          action: "connect",
          status: "error",
          details: `Token exchange failed (${tokenRes.status}): ${body.slice(0, 300)}`,
        },
      });
      return NextResponse.redirect(
        `${appsPageUrl}?error=${encodeURIComponent("Token exchange failed")}`
      );
    }

    const tokenData = await tokenRes.json();

    const credentials: StoredCredentials = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? "",
      expiresAt: Math.floor(Date.now() / 1000) + (tokenData.expires_in ?? 3600),
    };

    // Encrypt and store credentials, mark as READY
    await prisma.knowledgeApp.update({
      where: { id: state },
      data: {
        credentials: encrypt(JSON.stringify(credentials)),
        status: "READY",
        connectedAt: new Date(),
        errorMessage: null,
      },
    });

    await prisma.knowledgeAppSyncLog.create({
      data: {
        appId: state,
        action: "connect",
        status: "success",
        details: "OAuth connection established successfully",
      },
    });

    return NextResponse.redirect(`${appsPageUrl}?connected=${slug}`);
  } catch (e) {
    console.error(`OAuth callback error for ${slug}:`, e);
    if (state) {
      await prisma.knowledgeAppSyncLog.create({
        data: {
          appId: state,
          action: "connect",
          status: "error",
          details: e instanceof Error ? e.message : "Unknown error during OAuth callback",
        },
      }).catch(() => {});
    }
    return NextResponse.redirect(
      `${appsPageUrl}?error=${encodeURIComponent("OAuth callback failed")}`
    );
  }
}
