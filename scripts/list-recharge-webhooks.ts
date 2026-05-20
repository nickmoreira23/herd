import "dotenv/config";

import { RechargeService } from "@/lib/services/recharge";

/**
 * Sub-etapa 10.0.2 — read-only inspection of registered Recharge webhooks.
 * Usage: `npm run recharge:list-webhooks`
 */

const LOG_PREFIX = "[recharge:list-webhooks]";

async function main(): Promise<void> {
  const service = await RechargeService.fromIntegration();
  const webhooks = await service.listWebhooks();

  console.log(`${LOG_PREFIX} Found ${webhooks.length} webhook(s):`);
  if (webhooks.length === 0) {
    console.log("  (none registered)");
    return;
  }

  for (const wh of webhooks) {
    console.log(`  id=${wh.id}`);
    console.log(`    topic:    ${wh.topic}`);
    console.log(`    address:  ${wh.address}`);
    console.log(`    created:  ${wh.created_at}`);
    console.log(`    updated:  ${wh.updated_at}`);
    console.log("");
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`${LOG_PREFIX} ERROR: ${msg}`);
  process.exit(1);
});
