/**
 * Partner Scraping CLI Tool
 *
 * Fetches rich partner info from company websites and updates the database.
 *
 * Usage:
 *   npx tsx scripts/scrape-partners.ts --all                    # Process all partners
 *   npx tsx scripts/scrape-partners.ts --name "Transparent Labs" # Single partner
 *   npx tsx scripts/scrape-partners.ts --category "Supplements & Sports Nutrition"
 *   npx tsx scripts/scrape-partners.ts --status RESEARCHED       # Only researched partners
 *   npx tsx scripts/scrape-partners.ts --all --dry-run           # Preview without DB writes
 *   npx tsx scripts/scrape-partners.ts --all --delay 5000        # 5s between requests
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { scrapePage } from "./lib/scraper";
import { downloadImage } from "./lib/image-downloader";
import { randomDelay } from "./lib/rate-limiter";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

interface CliArgs {
  all: boolean;
  name: string | null;
  category: string | null;
  status: string | null;
  dryRun: boolean;
  delay: number;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    all: false,
    name: null,
    category: null,
    status: null,
    dryRun: false,
    delay: 3000,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--all":
        result.all = true;
        break;
      case "--name":
        result.name = args[++i];
        break;
      case "--category":
        result.category = args[++i];
        break;
      case "--status":
        result.status = args[++i];
        break;
      case "--dry-run":
        result.dryRun = true;
        break;
      case "--delay":
        result.delay = parseInt(args[++i], 10);
        break;
      case "--help":
        console.log(`
Partner Scraper — Enrich partner data from company websites

Flags:
  --all                  Process all partners with a websiteUrl
  --name "Name"          Process a single partner by name
  --category "Category"  Process all partners in a category
  --status STATUS        Only process partners with this status (e.g. RESEARCHED)
  --delay MS             Delay between requests in ms (default: 3000)
  --dry-run              Preview scraped data without writing to DB
  --help                 Show this help
        `);
        process.exit(0);
    }
  }

  if (!result.all && !result.name && !result.category && !result.status) {
    console.error("Error: Specify --all, --name, --category, or --status");
    process.exit(1);
  }

  return result;
}

async function main() {
  const args = parseArgs();

  console.log("Partner Scraper");
  console.log("===============");
  if (args.dryRun) console.log("DRY RUN — no database writes\n");

  // Build query
  const where: Record<string, unknown> = {
    websiteUrl: { not: null },
  };
  if (args.name) where.name = args.name;
  if (args.category) where.category = args.category;
  if (args.status) where.status = args.status;

  const partners = await prisma.partnerBrand.findMany({
    where,
    orderBy: { name: "asc" },
  });

  console.log(`Found ${partners.length} partners to process\n`);

  if (partners.length === 0) {
    console.log("No partners matched. Check your filters.");
    return;
  }

  const results: { name: string; success: boolean; error?: string }[] = [];

  for (let i = 0; i < partners.length; i++) {
    const partner = partners[i];
    console.log(`[${i + 1}/${partners.length}] ${partner.name} (${partner.websiteUrl})`);

    try {
      const scraped = await scrapePage(partner.websiteUrl!);

      console.log(`  Tagline: ${scraped.tagline?.substring(0, 80) || "(none)"}`);
      console.log(`  Description: ${scraped.description?.substring(0, 100) || "(none)"}`);
      console.log(`  Logo URL: ${scraped.logoUrl ? "found" : "(none)"}`);
      console.log(`  Hero URL: ${scraped.heroImageUrl ? "found" : "(none)"}`);

      if (!args.dryRun) {
        const updateData: Record<string, unknown> = {
          scrapedAt: new Date(),
        };

        // Only update fields that are currently empty and we have data for
        if (!partner.tagline && scraped.tagline) {
          updateData.tagline = scraped.tagline;
        }
        if (!partner.description && scraped.description) {
          updateData.description = scraped.description;
        }

        // Download and store logo
        if (!partner.logoUrl && scraped.logoUrl) {
          const localPath = await downloadImage(scraped.logoUrl, partner.name, "logo");
          if (localPath) updateData.logoUrl = localPath;
        }

        // Download and store hero image
        if (!partner.heroImageUrl && scraped.heroImageUrl) {
          const localPath = await downloadImage(scraped.heroImageUrl, partner.name, "hero");
          if (localPath) updateData.heroImageUrl = localPath;
        }

        await prisma.partnerBrand.update({
          where: { id: partner.id },
          data: updateData,
        });
        console.log(`  Updated DB`);
      }

      results.push({ name: partner.name, success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ERROR: ${message}`);
      results.push({ name: partner.name, success: false, error: message });
    }

    // Rate limit between requests
    if (i < partners.length - 1) {
      await randomDelay(args.delay * 0.8, args.delay * 1.2);
    }
  }

  // Summary
  console.log("\n===============");
  console.log("Summary:");
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`  Processed: ${results.length}`);
  console.log(`  Succeeded: ${succeeded}`);
  console.log(`  Failed: ${failed}`);

  if (failed > 0) {
    console.log("\nFailed partners:");
    results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
