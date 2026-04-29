/**
 * Backfill RoutineStep rows for routines that were created before the
 * multi-step refactor. Idempotent — safe to run more than once.
 *
 * Usage:
 *   npx tsx scripts/migrate-routines-to-steps.ts
 */

import { prisma } from "../src/lib/prisma";

async function main() {
  const routines = await prisma.routine.findMany({
    include: { steps: { select: { id: true } } },
  });

  let migrated = 0;
  let skipped = 0;

  for (const r of routines) {
    if (r.steps.length > 0) {
      skipped++;
      continue;
    }
    if (!r.agentId || !r.promptTemplate) {
      console.warn(
        `[skip] routine ${r.id} (${r.name}) has no steps and missing legacy agent/prompt`
      );
      skipped++;
      continue;
    }

    await prisma.routineStep.create({
      data: {
        routineId: r.id,
        stepOrder: 1,
        name: null,
        agentId: r.agentId,
        promptTemplate: r.promptTemplate,
        outputFormat: r.outputFormat ?? "text",
        inputSource: "trigger",
      },
    });
    migrated++;
    console.log(`[migrate] routine ${r.id} (${r.name}) → 1 step`);
  }

  console.log(`\nDone. migrated=${migrated} skipped=${skipped} total=${routines.length}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
