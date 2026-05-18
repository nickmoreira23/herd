import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  VerificationResult,
  WebhookVerifier,
} from "../verifier.interface";

/**
 * Gorgias webhook signature verification.
 *
 * Algorithm: HMAC-SHA256 over raw body, secret = webhook integration secret.
 * Header: `X-Gorgias-Signature` (hex digest, no prefix).
 *
 * Constant-time comparison on bytes — header is decoded as hex then compared
 * to the computed digest via `timingSafeEqual`. Length is checked first because
 * `timingSafeEqual` throws on size mismatch.
 *
 * Fail-closed: an empty secret rejects every webhook. The handler depends on
 * `GORGIAS_WEBHOOK_SECRET` being set in the environment; constructing the
 * verifier with an empty string is allowed (for tests / partial DEV setups)
 * but every call to `verify` returns `{ ok: false }`.
 */
export class GorgiasWebhookVerifier implements WebhookVerifier {
  static readonly SIGNATURE_HEADER = "x-gorgias-signature";

  constructor(private readonly secret: string) {}

  async verify(
    rawBody: Buffer,
    headers: Record<string, string>,
  ): Promise<VerificationResult> {
    if (!this.secret) {
      return {
        ok: false,
        reason: "gorgias webhook secret not configured",
        statusCode: 401,
      };
    }

    const provided = headers[GorgiasWebhookVerifier.SIGNATURE_HEADER];
    if (!provided) {
      return {
        ok: false,
        reason: `missing ${GorgiasWebhookVerifier.SIGNATURE_HEADER} header`,
        statusCode: 401,
      };
    }

    const expectedHex = createHmac("sha256", this.secret)
      .update(rawBody)
      .digest("hex");

    if (provided.length !== expectedHex.length) {
      return { ok: false, reason: "signature length mismatch", statusCode: 401 };
    }

    let providedBuf: Buffer;
    try {
      providedBuf = Buffer.from(provided, "hex");
    } catch {
      return { ok: false, reason: "signature not valid hex", statusCode: 401 };
    }
    const expectedBuf = Buffer.from(expectedHex, "hex");

    // `timingSafeEqual` throws on length mismatch; defensively guard even
    // though we already compared the hex-string length above (a truncated
    // hex decode could in theory produce a shorter buffer).
    if (providedBuf.length !== expectedBuf.length) {
      return { ok: false, reason: "signature length mismatch", statusCode: 401 };
    }

    return timingSafeEqual(expectedBuf, providedBuf)
      ? { ok: true }
      : { ok: false, reason: "signature mismatch", statusCode: 401 };
  }
}
