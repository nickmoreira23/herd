import "dotenv/config";
import { processPendingEvents } from "@/lib/domain-events/process-pending-events";

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 100;

  console.log(`[domain-events worker] Starting run, limit=${limit}`);
  const result = await processPendingEvents({ limit });

  console.log(`[domain-events worker] Done.`);
  console.log(`  Picked:     ${result.picked}`);
  console.log(`  Succeeded:  ${result.succeeded}`);
  console.log(`  Failed:     ${result.failed} (will retry)`);
  console.log(`  No handler: ${result.noHandler}`);
  console.log(`  Exhausted:  ${result.exhausted}`);

  if (result.failed > 0 || result.exhausted > 0) {
    console.log("\n[domain-events worker] Errors detail:");
    for (const r of result.results) {
      if (r.status === "failed" || r.status === "exhausted") {
        console.log(`  ${r.eventId} [${r.status}]: ${r.errorMessage}`);
      }
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("[domain-events worker] FAILED:", err);
  process.exit(1);
});
