#!/usr/bin/env tsx
import "dotenv/config";

import { createHash } from "node:crypto";

/**
 * Sub-etapa 17.0.8 — Recharge test webhook helper (dev convenience).
 *
 * Posts a hardcoded `charge/created` fixture form-encoded with the
 * canonical Recharge signature (`sha256(client_secret_bytes ++
 * raw_body_bytes)` hex — NOT HMAC) to `/api/webhooks/recharge`.
 *
 * Anti-HMAC convention is cravada in AGENTS.md ("Recharge signing — DO
 * NOT swap to createHmac") and enforced by a verifier test
 * (`recharge.verifier.test.ts`). If this script's signing diverges from
 * the verifier's `sha256(secret + body)` literal, the webhook returns
 * 401 — same fail-closed behavior the verifier guards in production.
 *
 * Use cases:
 *   - Local iteration without a real Recharge event landing.
 *   - Smoke against a deploy URL when waiting for Recharge to fire is
 *     impractical.
 *
 * NOT a replacement for a real Recharge webhook — this script bypasses
 * Recharge's delivery (no network/firewall/TLS validation).
 *
 * Usage:
 *   npm run recharge:test-webhook -- --base-url=http://localhost:3000
 */

interface Args {
  baseUrl: string;
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--base-url=")) {
      args.baseUrl = arg.slice("--base-url=".length);
    } else if (arg === "--base-url" && argv[i + 1]) {
      args.baseUrl = argv[++i]!;
    }
  }
  if (!args.baseUrl) args.baseUrl = "http://localhost:3000";
  return args as Args;
}

// Hardcoded charge/created fixture. Minimal shape — the resolver needs
// either a `customer_id` to match an existing MemberConnection, or
// falls back to the 1-tenant lookup (FALLBACK_PROVIDERS includes
// recharge — see AGENTS.md "Resolver fallback V1").
function buildFixture(): { topic: string; payload: Record<string, unknown> } {
  const now = new Date().toISOString();
  const id = Date.now();
  return {
    topic: "charge/created",
    payload: {
      charge: {
        id,
        customer_id: null,
        status: "queued",
        total_price: "59.99",
        scheduled_at: now,
        processed_at: null,
        created_at: now,
        updated_at: now,
        line_items: [
          {
            subscription_id: null,
            title: "HERD smoke charge/created",
            quantity: 1,
            price: "59.99",
          },
        ],
      },
    },
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const secret = process.env.RECHARGE_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[recharge:test-webhook] RECHARGE_WEBHOOK_SECRET not set in env.",
    );
    console.error(
      "  The verifier fails closed (401) when the secret is empty — set it before running.",
    );
    process.exit(1);
  }

  const targetUrl = `${args.baseUrl.replace(/\/$/, "")}/api/webhooks/recharge`;
  const { topic, payload } = buildFixture();
  const body = JSON.stringify(payload);

  // Canonical Recharge signing: sha256(secret + body) hex. NOT HMAC.
  const signature = createHash("sha256")
    .update(secret + body)
    .digest("hex");

  console.log("[recharge:test-webhook] Posting hardcoded charge/created fixture");
  console.log(`  target: ${targetUrl}`);
  console.log(`  topic: ${topic}`);
  console.log(`  body length: ${body.length}`);
  console.log(`  signature: ${signature.slice(0, 12)}... (sha256(secret+body))`);
  console.log("");

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Recharge-Hmac-Sha256": signature,
      "X-Recharge-Topic": topic,
    },
    body,
  });

  console.log(`[recharge:test-webhook] Status: ${response.status}`);
  const responseBody = await response.text();
  console.log(`[recharge:test-webhook] Body: ${responseBody}`);
  console.log("");

  if (response.status >= 200 && response.status < 300) {
    console.log("✓ Test webhook delivered. Verify outbox processing:");
    console.log(`  curl ${args.baseUrl}/api/health`);
    process.exit(0);
  } else {
    console.error("✗ Test webhook delivery failed.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[recharge:test-webhook] FATAL:", err);
  process.exit(1);
});
