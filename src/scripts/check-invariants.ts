import "dotenv/config";
import { checkAllInvariants } from "@/lib/ledger";

async function main() {
  console.log("[check:invariants] Running ledger invariant audit...");
  const violations = await checkAllInvariants();

  if (violations.length === 0) {
    console.log("[check:invariants] ✓ All invariants hold. Zero violations.");
    process.exit(0);
  }

  console.log(`[check:invariants] ✗ Found ${violations.length} violation(s):`);
  console.log("");
  for (const v of violations) {
    console.log(`  [${v.invariant}] row ${v.rowId}`);
    console.log(`    ${JSON.stringify(v.detail)}`);
  }
  console.log("");
  console.log("[check:invariants] These violations should be impossible given");
  console.log("the database constraints from Etapa 1.2 and 1.6. If they are");
  console.log("present, investigate: direct SQL writes, partial backup restore,");
  console.log("or a broken migration.");
  process.exit(1);
}

main().catch((err) => {
  console.error("[check:invariants] FAILED:", err);
  process.exit(1);
});
