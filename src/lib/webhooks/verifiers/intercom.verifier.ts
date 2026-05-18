import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  VerificationResult,
  WebhookVerifier,
} from "../verifier.interface";

/**
 * Intercom webhook signature verification.
 *
 * Algorithm: HMAC-SHA256 over raw body, secret = OAuth Client Secret.
 * Header: `X-Hub-Signature` with format `sha256=<hex digest>`.
 *
 * Same constant-time pattern as Gorgias, plus the `sha256=` prefix strip.
 */
export class IntercomWebhookVerifier implements WebhookVerifier {
  static readonly SIGNATURE_HEADER = "x-hub-signature";
  static readonly PREFIX = "sha256=";

  constructor(private readonly secret: string) {}

  async verify(
    rawBody: Buffer,
    headers: Record<string, string>,
  ): Promise<VerificationResult> {
    if (!this.secret) {
      return {
        ok: false,
        reason: "intercom webhook secret not configured",
        statusCode: 401,
      };
    }

    const provided = headers[IntercomWebhookVerifier.SIGNATURE_HEADER];
    if (!provided) {
      return {
        ok: false,
        reason: `missing ${IntercomWebhookVerifier.SIGNATURE_HEADER} header`,
        statusCode: 401,
      };
    }

    if (!provided.startsWith(IntercomWebhookVerifier.PREFIX)) {
      return {
        ok: false,
        reason: "signature missing sha256= prefix",
        statusCode: 401,
      };
    }

    const providedHex = provided.slice(IntercomWebhookVerifier.PREFIX.length);
    const expectedHex = createHmac("sha256", this.secret)
      .update(rawBody)
      .digest("hex");

    if (providedHex.length !== expectedHex.length) {
      return { ok: false, reason: "signature length mismatch", statusCode: 401 };
    }

    let providedBuf: Buffer;
    try {
      providedBuf = Buffer.from(providedHex, "hex");
    } catch {
      return { ok: false, reason: "signature not valid hex", statusCode: 401 };
    }
    const expectedBuf = Buffer.from(expectedHex, "hex");

    if (providedBuf.length !== expectedBuf.length) {
      return { ok: false, reason: "signature length mismatch", statusCode: 401 };
    }

    return timingSafeEqual(expectedBuf, providedBuf)
      ? { ok: true }
      : { ok: false, reason: "signature mismatch", statusCode: 401 };
  }
}
