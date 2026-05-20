import "dotenv/config";

import { RechargeService } from "@/lib/services/recharge";

/**
 * Sub-etapa 10.0.2 — delete a single Recharge webhook by id.
 * Usage: `npm run recharge:delete-webhook -- --id <webhook_id>`
 * Find IDs via `npm run recharge:list-webhooks`.
 */

const LOG_PREFIX = "[recharge:delete-webhook]";

interface ParsedArgs {
  id: string | null;
  help: boolean;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const result: ParsedArgs = { id: null, help: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--id" && args[i + 1]) {
      result.id = args[++i];
    } else if (args[i] === "--help" || args[i] === "-h") {
      result.help = true;
    }
  }
  return result;
}

async function main(): Promise<void> {
  const { id, help } = parseArgs();

  if (help || !id) {
    console.log(
      `${LOG_PREFIX} Usage: npm run recharge:delete-webhook -- --id <webhook_id>`,
    );
    console.log(
      `${LOG_PREFIX} Find IDs via 'npm run recharge:list-webhooks'.`,
    );
    process.exit(id ? 0 : 1);
  }

  const service = await RechargeService.fromIntegration();
  await service.deleteWebhook(id);
  console.log(`${LOG_PREFIX} ✓ Deleted webhook id=${id}`);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`${LOG_PREFIX} ERROR: ${msg}`);
  process.exit(1);
});
