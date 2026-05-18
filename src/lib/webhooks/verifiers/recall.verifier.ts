import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  VerificationResult,
  WebhookVerifier,
} from "../verifier.interface";

/**
 * Recall.ai webhook signature verification — Svix-style.
 *
 * Recall delegates webhook delivery to Svix. The signature scheme is Svix's
 * standard: HMAC-SHA256 over `${svix-id}.${svix-timestamp}.${raw-body}` with
 * the base64-decoded secret bytes (`whsec_` prefix stripped).
 *
 * Headers:
 *  - `svix-id` — unique webhook delivery ID.
 *  - `svix-timestamp` — Unix seconds.
 *  - `svix-signature` — space-separated list of `<version>,<base64-sig>` pairs.
 *    e.g. `v1,abc... v1,def...` during key rotation. Match if ANY signature
 *    matches; verifier returns ok on first hit.
 *
 * Replay protection (5-minute window) is NOT enforced here — Sub-etapa 6
 * adds dedup via the outbox, which subsumes replay protection. Adding a
 * timestamp tolerance check would be premature optimization.
 */
export class RecallWebhookVerifier implements WebhookVerifier {
  static readonly ID_HEADER = "svix-id";
  static readonly TIMESTAMP_HEADER = "svix-timestamp";
  static readonly SIGNATURE_HEADER = "svix-signature";
  static readonly SECRET_PREFIX = "whsec_";
  static readonly SIGNATURE_VERSION = "v1";

  /**
   * Constructor accepts the raw secret as provided by Recall (with `whsec_`
   * prefix). The base64 portion is decoded once and stored as the HMAC key.
   */
  private readonly key: Buffer;

  constructor(rawSecret: string) {
    if (!rawSecret) {
      this.key = Buffer.alloc(0);
      return;
    }
    const stripped = rawSecret.startsWith(RecallWebhookVerifier.SECRET_PREFIX)
      ? rawSecret.slice(RecallWebhookVerifier.SECRET_PREFIX.length)
      : rawSecret;
    try {
      this.key = Buffer.from(stripped, "base64");
    } catch {
      this.key = Buffer.alloc(0);
    }
  }

  async verify(
    rawBody: Buffer,
    headers: Record<string, string>,
  ): Promise<VerificationResult> {
    if (this.key.length === 0) {
      return {
        ok: false,
        reason: "recall webhook secret not configured",
        statusCode: 401,
      };
    }

    const id = headers[RecallWebhookVerifier.ID_HEADER];
    const timestamp = headers[RecallWebhookVerifier.TIMESTAMP_HEADER];
    const sigHeader = headers[RecallWebhookVerifier.SIGNATURE_HEADER];

    if (!id || !timestamp || !sigHeader) {
      return {
        ok: false,
        reason: "missing svix-{id,timestamp,signature} header",
        statusCode: 401,
      };
    }

    // Signing string: `${id}.${timestamp}.${body}`. Body is appended as bytes,
    // not a stringified copy, to handle non-UTF8 sequences correctly.
    const prefix = Buffer.from(`${id}.${timestamp}.`, "utf8");
    const payload = Buffer.concat([prefix, rawBody]);
    const expected = createHmac("sha256", this.key).update(payload).digest();

    // svix-signature header: space-separated list of `<version>,<base64>`.
    // We accept any entry where version === "v1" and the base64-decoded
    // signature matches `expected` in constant time.
    const entries = sigHeader.split(" ");
    for (const entry of entries) {
      const commaIdx = entry.indexOf(",");
      if (commaIdx === -1) continue;
      const version = entry.slice(0, commaIdx);
      if (version !== RecallWebhookVerifier.SIGNATURE_VERSION) continue;
      const sigBase64 = entry.slice(commaIdx + 1);
      let provided: Buffer;
      try {
        provided = Buffer.from(sigBase64, "base64");
      } catch {
        continue;
      }
      if (provided.length !== expected.length) continue;
      if (timingSafeEqual(provided, expected)) {
        return { ok: true };
      }
    }

    return { ok: false, reason: "no matching signature", statusCode: 401 };
  }
}
