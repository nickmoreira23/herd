/**
 * Reclassify voice/video provider integrations from AI_MODELS/OTHER → VOICE/VIDEO.
 * Idempotent. Run with: npx tsx scripts/recategorize-voice-video.ts
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

const VOICE_SLUGS = ["deepgram", "elevenlabs", "plaud", "whisper", "assemblyai"];
const VIDEO_SLUGS = ["runway", "heygen", "synthesia", "pika", "luma"];

async function main() {
  const all = await prisma.integration.findMany({
    select: { id: true, slug: true, name: true, category: true },
  });

  console.log("Current integrations:");
  for (const i of all) {
    console.log(`  ${i.category.padEnd(22)} ${i.slug.padEnd(25)} ${i.name}`);
  }
  console.log();

  let voiceCount = 0;
  let videoCount = 0;

  for (const integ of all) {
    if (VOICE_SLUGS.includes(integ.slug) && integ.category !== "VOICE") {
      await prisma.integration.update({
        where: { id: integ.id },
        data: { category: "VOICE" },
      });
      console.log(`→ ${integ.slug}: ${integ.category} → VOICE`);
      voiceCount++;
    } else if (VIDEO_SLUGS.includes(integ.slug) && integ.category !== "VIDEO") {
      await prisma.integration.update({
        where: { id: integ.id },
        data: { category: "VIDEO" },
      });
      console.log(`→ ${integ.slug}: ${integ.category} → VIDEO`);
      videoCount++;
    }
  }

  console.log(`\nReclassified ${voiceCount} → VOICE, ${videoCount} → VIDEO`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
