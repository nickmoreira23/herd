import "dotenv/config";
import { seedPlatformAccounts } from "@/lib/ledger/seed-platform-accounts";

async function main() {
  console.log("[ledger seed] Starting platform accounts seed...");
  const result = await seedPlatformAccounts();
  console.log(`[ledger seed] Done. ${result.total} total accounts.`);
  console.log(`  Created:   ${result.created.length} (${result.created.join(", ") || "—"})`);
  console.log(`  Updated:   ${result.updated.length} (${result.updated.join(", ") || "—"})`);
  console.log(`  Unchanged: ${result.unchanged.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[ledger seed] FAILED:", err);
  process.exit(1);
});
