#!/usr/bin/env tsx
import "dotenv/config";

import { BraintreeService } from "@/lib/services/braintree";

/**
 * Sub-etapa 17 — Braintree test webhook helper (dev convenience).
 *
 * Generates a valid `{bt_signature, bt_payload}` pair via
 * `gateway.webhookTesting.sampleNotification(kind, id)` and POSTs it
 * form-encoded to the configured `/api/webhooks/braintree` endpoint.
 *
 * Use cases:
 *   - Local iteration without round-tripping Braintree's Control Panel.
 *   - Smoke against a deploy URL when Control Panel "Check URL" is too
 *     slow or when you want a specific kind+id combination.
 *
 * NOT a replacement for the Control Panel "Check URL" button — only the
 * Control Panel button validates that Braintree → endpoint network path
 * works (firewall, DNS, TLS). This script bypasses Braintree entirely.
 *
 * Sub-etapa 16 (programmatic webhook *registration*) is not possible —
 * Braintree SDK does not expose webhook destination CRUD. Webhook URLs
 * must be configured manually in the Control Panel.
 *
 * Usage:
 *   npm run braintree:test-webhook -- \
 *     --base-url=http://localhost:3000 \
 *     --kind=transaction_settled \
 *     --id=test_txn_smoke
 *
 * Valid kinds (12 manifest topics):
 *   Subscription: subscription_charged_{successfully,unsuccessfully},
 *     subscription_{canceled,trial_ended,went_past_due,expired}
 *   Transaction:  transaction_{settled,settlement_declined,disbursed}
 *   Dispute:      dispute_{opened,lost,won}
 */

interface Args {
  baseUrl: string;
  kind: string;
  id: string;
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--base-url=")) {
      args.baseUrl = arg.slice("--base-url=".length);
    } else if (arg.startsWith("--kind=")) {
      args.kind = arg.slice("--kind=".length);
    } else if (arg.startsWith("--id=")) {
      args.id = arg.slice("--id=".length);
    } else if (arg === "--base-url" && argv[i + 1]) {
      args.baseUrl = argv[++i]!;
    } else if (arg === "--kind" && argv[i + 1]) {
      args.kind = argv[++i]!;
    } else if (arg === "--id" && argv[i + 1]) {
      args.id = argv[++i]!;
    }
  }

  if (!args.baseUrl || !args.kind || !args.id) {
    console.error(
      "Usage: tsx scripts/test-braintree-webhook.ts --base-url <url> --kind <kind> --id <subject_id>",
    );
    console.error("");
    console.error("Example:");
    console.error("  npm run braintree:test-webhook -- \\");
    console.error("    --base-url=http://localhost:3000 \\");
    console.error("    --kind=transaction_settled \\");
    console.error("    --id=test_txn_smoke");
    console.error("");
    console.error("Valid kinds (manifest topics, V1 = 12):");
    console.error("  Subscription: subscription_charged_successfully,");
    console.error("                subscription_charged_unsuccessfully,");
    console.error("                subscription_canceled,");
    console.error("                subscription_trial_ended,");
    console.error("                subscription_went_past_due,");
    console.error("                subscription_expired");
    console.error("  Transaction:  transaction_settled,");
    console.error("                transaction_settlement_declined,");
    console.error("                transaction_disbursed");
    console.error("  Dispute:      dispute_opened, dispute_lost, dispute_won");
    process.exit(1);
  }

  return args as Args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const targetUrl = `${args.baseUrl.replace(/\/$/, "")}/api/webhooks/braintree`;

  console.log("[braintree:test-webhook] Generating sample notification");
  console.log(`  kind: ${args.kind}`);
  console.log(`  subject id: ${args.id}`);
  console.log(`  target: ${targetUrl}`);
  console.log("");

  const service = await BraintreeService.fromIntegration();

  // `webhookTesting` is an instance member missing from @types/braintree v3.4
  // (Sub-etapa 14 discovery). Narrow through unknown to invoke at runtime.
  const wt = (
    service.gateway as unknown as {
      webhookTesting: {
        sampleNotification: (kind: string, id: string) => {
          bt_signature: string;
          bt_payload: string;
        };
      };
    }
  ).webhookTesting;
  const sample = wt.sampleNotification(args.kind, args.id);

  console.log(
    `[braintree:test-webhook] Sample generated: bt_signature length=${sample.bt_signature.length}, bt_payload length=${sample.bt_payload.length}`,
  );
  console.log("");

  const body = new URLSearchParams({
    bt_signature: sample.bt_signature,
    bt_payload: sample.bt_payload,
  }).toString();

  console.log(`[braintree:test-webhook] POST ${targetUrl}`);
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  console.log(`[braintree:test-webhook] Status: ${response.status}`);
  const responseBody = await response.text();
  console.log(`[braintree:test-webhook] Body: ${responseBody}`);
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
  console.error("[braintree:test-webhook] FATAL:", err);
  process.exit(1);
});
