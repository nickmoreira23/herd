import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

// ─── OAuth Config ───────────────────────────────────────────────

export interface IntegrationOAuthConfig {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
}

export const INTEGRATION_OAUTH_CONFIGS: Record<string, IntegrationOAuthConfig> = {
  "google-calendar": {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  gmail: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.labels",
    ],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  "microsoft-outlook": {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: [
      "Calendars.ReadWrite",
      "User.Read",
      "offline_access",
    ],
    clientIdEnv: "MICROSOFT_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
  },
  zoom: {
    authUrl: "https://zoom.us/oauth/authorize",
    tokenUrl: "https://zoom.us/oauth/token",
    scopes: [
      "meeting:read",
      "meeting:write",
      "user:read",
      "recording:read",
    ],
    clientIdEnv: "ZOOM_CLIENT_ID",
    clientSecretEnv: "ZOOM_CLIENT_SECRET",
  },
  slack: {
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: [
      "channels:read",
      "channels:history",
      "users:read",
      "users:read.email",
      "team:read",
      "chat:write",
    ],
    clientIdEnv: "SLACK_CLIENT_ID",
    clientSecretEnv: "SLACK_CLIENT_SECRET",
  },
};

export function getIntegrationOAuthConfig(slug: string): IntegrationOAuthConfig | null {
  return INTEGRATION_OAUTH_CONFIGS[slug] ?? null;
}

export function getIntegrationCallbackUrl(): string {
  const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/api/integrations/oauth/callback`;
}

// ─── Stored Credentials ─────────────────────────────────────────

export interface IntegrationOAuthCredentials {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null; // Unix seconds
}

/**
 * Build the OAuth authorize URL for a given integration.
 * Handles provider-specific differences (Google, Microsoft, Zoom).
 */
export function buildAuthorizeUrl(slug: string, integrationId: string, returnTo?: string): string {
  const config = getIntegrationOAuthConfig(slug);
  if (!config) throw new Error(`No OAuth config for slug: ${slug}`);

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) throw new Error(`Missing env var: ${config.clientIdEnv}`);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getIntegrationCallbackUrl(),
    response_type: "code",
    scope: config.scopes.join(" "),
    state: returnTo
      ? `${slug}:${integrationId}:${Buffer.from(returnTo).toString("base64url")}`
      : `${slug}:${integrationId}`,
  });

  // Provider-specific params
  if (slug === "slack") {
    // Slack V2 uses "scope" for bot scopes (comma-separated, not space)
    params.delete("scope");
    params.delete("response_type"); // Slack doesn't use response_type
    params.set("scope", config.scopes.join(","));
  } else if (slug === "microsoft-outlook") {
    params.set("prompt", "consent");
    // Microsoft uses response_mode=query by default, no access_type needed
  } else if (slug === "zoom") {
    // Zoom doesn't use access_type or prompt params
  } else {
    // Google-style defaults
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }

  return `${config.authUrl}?${params.toString()}`;
}

// ─── Token Refresh ──────────────────────────────────────────────

/**
 * Retrieve a valid access token for an OAuth-based integration.
 * Refreshes automatically if expired.
 */
export async function getValidIntegrationToken(integrationId: string): Promise<string> {
  const integration = await prisma.integration.findUnique({ where: { id: integrationId } });
  if (!integration) throw new Error("Integration not found");
  if (!integration.credentials) throw new Error("Integration not connected");

  const creds: IntegrationOAuthCredentials = JSON.parse(decrypt(integration.credentials));

  // If token expires in more than 5 minutes, it's still valid
  const now = Math.floor(Date.now() / 1000);
  if (creds.expiresAt && creds.expiresAt > now + 300) {
    return creds.accessToken;
  }

  // Token expired or expiring soon — refresh
  if (!creds.refreshToken) {
    throw new Error("Token expired and no refresh token available. Please reconnect.");
  }

  const config = getIntegrationOAuthConfig(integration.slug);
  if (!config) throw new Error(`No OAuth config for slug: ${integration.slug}`);

  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];
  if (!clientId || !clientSecret) {
    throw new Error(`Missing env vars: ${config.clientIdEnv} / ${config.clientSecretEnv}`);
  }

  // Zoom requires Basic auth header for token exchange
  const isZoom = integration.slug === "zoom";
  const refreshHeaders: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const refreshBody = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: creds.refreshToken,
  });

  if (isZoom) {
    refreshHeaders.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  } else {
    refreshBody.set("client_id", clientId);
    refreshBody.set("client_secret", clientSecret);
  }

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: refreshHeaders,
    body: refreshBody,
  });

  if (!res.ok) {
    const body = await res.text();
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: "ERROR",
        lastSyncError: `Token refresh failed (${res.status}): ${body.slice(0, 200)}`,
      },
    });
    throw new Error(`Token refresh failed: ${res.status}`);
  }

  const tokenData = await res.json();
  const newCreds: IntegrationOAuthCredentials = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? creds.refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + (tokenData.expires_in ?? 3600),
  };

  await prisma.integration.update({
    where: { id: integrationId },
    data: {
      credentials: encrypt(JSON.stringify(newCreds)),
      lastSyncError: null,
    },
  });

  return newCreds.accessToken;
}
