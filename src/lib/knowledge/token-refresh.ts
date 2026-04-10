import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { getOAuthConfig } from "./app-config";

export interface StoredCredentials {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null; // Unix timestamp in seconds, null for PATs
  manualEntry?: boolean; // true when connected via personal access token
}

/**
 * Parse stored credentials — handles both encrypted and plain JSON.
 */
function parseCredentials(raw: string): StoredCredentials {
  // Try decrypting first (production flow)
  try {
    return JSON.parse(decrypt(raw));
  } catch {
    // Fall back to plain JSON (dev mode or PAT without encryption)
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("Unable to parse stored credentials");
    }
  }
}

/**
 * Retrieves a valid access token for a KnowledgeApp.
 * - For personal access tokens (manualEntry), returns the token directly.
 * - For OAuth tokens, refreshes if expired.
 */
export async function getValidAccessToken(appId: string): Promise<string> {
  const app = await prisma.knowledgeApp.findUnique({ where: { id: appId } });
  if (!app) throw new Error("App not found");
  if (!app.credentials) throw new Error("App not connected — no credentials stored");

  const creds = parseCredentials(app.credentials);

  // Personal access tokens don't expire — return directly
  if (creds.manualEntry || !creds.expiresAt) {
    return creds.accessToken;
  }

  // If token expires in more than 5 minutes, it's still valid
  const now = Math.floor(Date.now() / 1000);
  if (creds.expiresAt > now + 300) {
    return creds.accessToken;
  }

  // Token expired or expiring soon — refresh it
  if (!creds.refreshToken) {
    throw new Error("Token expired and no refresh token available. Please reconnect the app.");
  }

  const config = getOAuthConfig(app.slug);
  if (!config) throw new Error(`No OAuth config for slug: ${app.slug}`);

  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];
  if (!clientId || !clientSecret) {
    throw new Error(`Missing env vars: ${config.clientIdEnv} / ${config.clientSecretEnv}`);
  }

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: creds.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    await prisma.knowledgeApp.update({
      where: { id: appId },
      data: {
        status: "ERROR",
        errorMessage: `Token refresh failed (${res.status}): ${body.slice(0, 200)}`,
      },
    });
    throw new Error(`Token refresh failed: ${res.status} ${body}`);
  }

  const tokenData = await res.json();
  const newCreds: StoredCredentials = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? creds.refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + (tokenData.expires_in ?? 3600),
  };

  // Re-encrypt updated credentials
  let storedCredentials: string;
  try {
    storedCredentials = encrypt(JSON.stringify(newCreds));
  } catch {
    storedCredentials = JSON.stringify(newCreds);
  }

  await prisma.knowledgeApp.update({
    where: { id: appId },
    data: {
      credentials: storedCredentials,
      errorMessage: null,
    },
  });

  return newCreds.accessToken;
}
