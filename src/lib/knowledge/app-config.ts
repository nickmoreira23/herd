export interface AppOAuthConfig {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
}

export const APP_OAUTH_CONFIGS: Record<string, AppOAuthConfig> = {
  oura: {
    authUrl: "https://cloud.ouraring.com/oauth/authorize",
    tokenUrl: "https://api.ouraring.com/oauth/token",
    scopes: ["personal", "daily", "heartrate"],
    clientIdEnv: "OURA_CLIENT_ID",
    clientSecretEnv: "OURA_CLIENT_SECRET",
  },
  whoop: {
    authUrl: "https://api.prod.whoop.com/oauth/oauth2/auth",
    tokenUrl: "https://api.prod.whoop.com/oauth/oauth2/token",
    scopes: [
      "read:profile",
      "read:cycles",
      "read:recovery",
      "read:sleep",
      "read:workout",
      "read:body_measurement",
    ],
    clientIdEnv: "WHOOP_CLIENT_ID",
    clientSecretEnv: "WHOOP_CLIENT_SECRET",
  },
};

export function getOAuthConfig(slug: string): AppOAuthConfig | null {
  return APP_OAUTH_CONFIGS[slug] ?? null;
}

export function getCallbackUrl(slug: string): string {
  const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/api/knowledge/apps/callback/${slug}`;
}
