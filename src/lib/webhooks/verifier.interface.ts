/**
 * Sub-etapa 5 — Webhook signature verification framework.
 *
 * Each provider implements `WebhookVerifier`. The interface enforces three
 * properties:
 *  - Raw body is `Buffer` (verifiers compute over bytes, not parsed JSON).
 *  - Headers are passed as a flat record (verifiers pick what they need).
 *  - Result is a discriminated union — callers branch on `ok`, never on
 *    truthy/falsy alone.
 *
 * Verifiers are constructed with secrets at instance creation time and fail
 * closed when their secret is missing (returns `ok: false` rather than
 * throwing). This is the load-bearing default: a misconfigured environment
 * rejects webhooks instead of accepting them. Never relax this.
 */

export type VerificationResult =
  | { ok: true }
  | { ok: false; reason: string; statusCode: 401 | 400 };

export interface WebhookVerifier {
  verify(
    rawBody: Buffer,
    headers: Record<string, string>,
  ): Promise<VerificationResult>;
}
