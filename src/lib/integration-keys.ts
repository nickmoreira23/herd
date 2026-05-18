import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

/**
 * Resolve the Anthropic API key: integration system first, env var fallback.
 * Throws a descriptive error if neither is available.
 */
export async function resolveAnthropicKey(): Promise<string> {
  const integrationKey = await getIntegrationApiKey("anthropic");
  if (integrationKey) return integrationKey;
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  throw new Error(
    "Anthropic API key not configured. Connect Anthropic in Settings → Integrations, or set the ANTHROPIC_API_KEY environment variable."
  );
}

/**
 * Retrieve a decrypted API key from the integrations table by slug.
 * Returns null if the integration is not connected or has no credentials.
 *
 * Usage:
 *   const key = await getIntegrationApiKey("anthropic");
 *   if (!key) throw new Error("Anthropic integration not connected");
 */
export async function getIntegrationApiKey(
  slug: string
): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { slug },
    select: { credentials: true, status: true },
  });

  if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
    return null;
  }

  try {
    const decrypted = decrypt(integration.credentials);
    const parsed = JSON.parse(decrypted);
    return parsed.apiToken || null;
  } catch {
    return null;
  }
}

/**
 * Retrieve full decrypted credentials from the integrations table by slug.
 * Returns null if not connected. Useful for integrations that store multiple fields.
 */
export async function getIntegrationCredentials(
  slug: string
): Promise<Record<string, string> | null> {
  const integration = await prisma.integration.findUnique({
    where: { slug },
    select: { credentials: true, status: true },
  });

  if (!integration || integration.status !== "CONNECTED" || !integration.credentials) {
    return null;
  }

  try {
    const decrypted = decrypt(integration.credentials);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}
