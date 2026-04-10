/**
 * Scrape hero/logo images from partner websites and update the database.
 * Extracts og:image, twitter:image, or logo from meta tags.
 *
 * Usage: npx tsx scripts/scrape-partner-images.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();

    // Try og:image first
    const ogMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    ) ??
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
      );
    if (ogMatch?.[1]) return resolveUrl(ogMatch[1], url);

    // Try twitter:image
    const twMatch = html.match(
      /<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
    ) ??
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']twitter:image["']/i
      );
    if (twMatch?.[1]) return resolveUrl(twMatch[1], url);

    // Try link rel="icon" with larger sizes or apple-touch-icon
    const appleIcon = html.match(
      /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i
    );
    if (appleIcon?.[1]) return resolveUrl(appleIcon[1], url);

    return null;
  } catch {
    return null;
  }
}

function resolveUrl(imgUrl: string, baseUrl: string): string {
  if (imgUrl.startsWith("http")) return imgUrl;
  if (imgUrl.startsWith("//")) return "https:" + imgUrl;
  try {
    return new URL(imgUrl, baseUrl).href;
  } catch {
    return imgUrl;
  }
}

async function main() {
  const partners = await prisma.partnerBrand.findMany({
    where: { logoUrl: null },
    select: { id: true, name: true, websiteUrl: true },
    orderBy: { name: "asc" },
  });

  console.log(`Found ${partners.length} partners without images.\n`);

  let updated = 0;
  let failed = 0;

  for (const partner of partners) {
    if (!partner.websiteUrl || partner.websiteUrl.includes("example.com")) {
      console.log(`⏭  ${partner.name} — no valid website URL`);
      failed++;
      continue;
    }

    const imageUrl = await fetchOgImage(partner.websiteUrl);

    if (imageUrl) {
      await prisma.partnerBrand.update({
        where: { id: partner.id },
        data: { logoUrl: imageUrl },
      });
      console.log(`✅ ${partner.name} → ${imageUrl.substring(0, 80)}...`);
      updated++;
    } else {
      console.log(`❌ ${partner.name} — no image found`);
      failed++;
    }

    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone: ${updated} updated, ${failed} failed/skipped.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
