import braintree from "braintree";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

/**
 * Braintree credentials shape encrypted in `Integration.credentials`.
 *
 * Three-key auth (Braintree convention): `merchantId` identifies the
 * Braintree account, `publicKey` + `privateKey` form the API credentials.
 * `environment` toggles between sandbox and production at SDK init.
 */
interface BraintreeCredentials {
  merchantId: string;
  publicKey: string;
  privateKey: string;
  environment: "sandbox" | "production";
}

/**
 * Wrapper around the Braintree SDK Gateway with a factory that loads
 * credentials (encrypted) from the platform-wide `Integration` row.
 *
 * Sub-etapa 13 — Camada 2. Adapter foundation only. Webhook handling,
 * mappers, and programmatic webhook registration land in Sub-etapas 14-16.
 *
 * @see scripts/seed-braintree-integration.ts
 * @see RechargeService.fromIntegration() — analogous pattern (Sub-etapa 10)
 */
export class BraintreeService {
  private constructor(public readonly gateway: braintree.BraintreeGateway) {}

  /**
   * Factory that loads encrypted credentials from the `braintree`
   * Integration row, decrypts, validates the shape, and constructs a
   * configured `BraintreeGateway`.
   */
  static async fromIntegration(): Promise<BraintreeService> {
    const integration = await prisma.integration.findUnique({
      where: { slug: "braintree" },
    });

    if (!integration?.credentials) {
      throw new Error("Braintree integration not connected (no credentials).");
    }
    if (integration.authType && integration.authType !== "api_key") {
      throw new Error(
        `Braintree integration authType is ${integration.authType}, expected 'api_key'.`,
      );
    }

    const decrypted = decrypt(integration.credentials);
    const creds = JSON.parse(decrypted) as BraintreeCredentials;

    if (
      !creds.merchantId ||
      !creds.publicKey ||
      !creds.privateKey ||
      !creds.environment
    ) {
      throw new Error(
        "Braintree credentials missing required fields: merchantId, publicKey, privateKey, environment.",
      );
    }

    const environment =
      creds.environment === "production"
        ? braintree.Environment.Production
        : braintree.Environment.Sandbox;

    const gateway = new braintree.BraintreeGateway({
      environment,
      merchantId: creds.merchantId,
      publicKey: creds.publicKey,
      privateKey: creds.privateKey,
    });

    return new BraintreeService(gateway);
  }

  /**
   * Read-only ping to verify the gateway can authenticate. Safe to run
   * against production — only lists merchant accounts (no PII fetched).
   */
  async testConnection(): Promise<{
    ok: boolean;
    merchantAccountId?: string;
  }> {
    try {
      const response = await this.gateway.merchantAccount.all();
      // `response` is a collection — pull the first id as a probe.
      const firstId = (
        response as unknown as { ids?: string[] }
      ).ids?.[0];
      return { ok: true, merchantAccountId: firstId ?? "unknown" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Braintree testConnection failed: ${msg}`);
    }
  }

  // ── Webhooks ──
  //
  // Sub-etapa 16 will implement programmatic webhook registration via the
  // Braintree SDK. The SDK does not expose CRUD over `webhookNotification`
  // directly; destinations are managed through the Control Panel REST API
  // (or via the SDK's deprecated `WebhookTesting` helper for fixtures).
  // Sub-etapa 16 will crystallize the exact approach after a small spike.
  //
  // @see scripts/register-braintree-webhooks.ts (Sub-etapa 16)
  // @see scripts/list-braintree-webhooks.ts (Sub-etapa 16)
  // @see scripts/delete-braintree-webhook.ts (Sub-etapa 16)

  async listWebhooks(): Promise<never> {
    throw new Error("Not implemented yet — Sub-etapa 16.");
  }

  async createWebhook(_destination: string, _kinds: string[]): Promise<never> {
    throw new Error("Not implemented yet — Sub-etapa 16.");
  }

  async deleteWebhook(_id: string): Promise<never> {
    throw new Error("Not implemented yet — Sub-etapa 16.");
  }
}
