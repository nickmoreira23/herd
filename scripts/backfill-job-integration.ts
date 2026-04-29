/**
 * Backfill VoiceJob.integrationId / VideoJob.integrationId by matching
 * job.provider against Integration.slug. Safe to re-run.
 *
 * Run with: npx tsx scripts/backfill-job-integration.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config({ path: ".env" });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DIRECT_URL or DATABASE_URL env var");
  process.exit(1);
}
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const integrations = await prisma.integration.findMany({
    select: { id: true, slug: true },
  });
  const bySlug = new Map(integrations.map((i) => [i.slug, i.id]));

  let voiceUpdated = 0;
  let voiceSkipped = 0;
  const voiceJobs = await prisma.voiceJob.findMany({
    where: { integrationId: null },
    select: { id: true, provider: true },
  });
  for (const job of voiceJobs) {
    const integrationId = bySlug.get(job.provider);
    if (!integrationId) {
      voiceSkipped++;
      continue;
    }
    await prisma.voiceJob.update({
      where: { id: job.id },
      data: { integrationId },
    });
    voiceUpdated++;
  }

  let videoUpdated = 0;
  let videoSkipped = 0;
  const videoJobs = await prisma.videoJob.findMany({
    where: { integrationId: null },
    select: { id: true, provider: true },
  });
  for (const job of videoJobs) {
    const integrationId = bySlug.get(job.provider);
    if (!integrationId) {
      videoSkipped++;
      continue;
    }
    await prisma.videoJob.update({
      where: { id: job.id },
      data: { integrationId },
    });
    videoUpdated++;
  }

  console.log(
    `VoiceJob: ${voiceUpdated} linked, ${voiceSkipped} skipped (no matching integration slug)`
  );
  console.log(
    `VideoJob: ${videoUpdated} linked, ${videoSkipped} skipped (no matching integration slug)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
