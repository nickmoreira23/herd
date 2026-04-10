import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { extractProductData } from "../src/lib/products/product-scraper";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: "chromium",
    args: ["--headless=new", "--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });
  await context.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => false }); });

  const page = await context.newPage();

  // Step 1: Get sitemap URLs via Playwright
  console.log("=== STEP 1: Sitemap Discovery ===");
  await page.goto("https://www.buckedup.com/sitemap.xml", { waitUntil: "domcontentloaded", timeout: 30000 });
  try { await page.waitForFunction(() => document.title !== "Just a moment...", { timeout: 15000 }); } catch {}
  await page.waitForTimeout(5000);

  const sitemapUrls = await page.evaluate(() => {
    const locs = document.querySelectorAll("loc");
    return Array.from(locs).map(l => l.textContent?.trim()).filter(Boolean) as string[];
  });

  // Filter product URLs
  const productUrls = sitemapUrls.filter(u => {
    const path = new URL(u).pathname.toLowerCase();
    if (path === "/") return false;
    if (/\/(cart|checkout|account|login|search|blog|faq|about|contact|privacy|terms|policy|shipping|returns|help|support|sitemap)/i.test(path)) return false;
    // /shop/slug pattern
    if (/\/shop\/[^/]+$/.test(path)) return true;
    // Root-level slugs
    const segs = path.split("/").filter(Boolean);
    if (segs.length === 1 && segs[0].includes("-") && segs[0].length > 10) {
      if (/^(subscribe|become|wholesale|terms|castaway|referral|ambassador)/i.test(segs[0])) return false;
      return true;
    }
    return false;
  });

  console.log(`Total sitemap URLs: ${sitemapUrls.length}`);
  console.log(`Product URLs after filtering: ${productUrls.length}`);
  console.log("Sample:", productUrls.slice(0, 10).map(u => new URL(u).pathname));

  // Step 2: Test scraping 5 different product pages
  console.log("\n=== STEP 2: Test Scraping 5 Products ===");
  const testUrls = productUrls.slice(0, 5);
  
  for (const url of testUrls) {
    console.log(`\nScraping: ${new URL(url).pathname}`);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      try { await page.waitForFunction(() => document.title !== "Just a moment...", { timeout: 15000 }); } catch {}
      await page.waitForTimeout(3000);
      const html = await page.content();
      
      const data = extractProductData(html, url);
      console.log(`  Name: ${data.name || "NULL"}`);
      console.log(`  Brand: ${data.brand || "NULL"}`);
      console.log(`  Price: ${data.price ?? "NULL"}`);
      console.log(`  Images: ${data.images.length}`);
      console.log(`  Variants: ${data.variants.length} (${data.variants.map(v => `${v.name}:${v.options.length}`).join(", ")})`);
      console.log(`  Supplement facts: ${data.supplementFacts.length}`);
    } catch (err) {
      console.log(`  ERROR: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }

  await browser.close();
  console.log("\n=== DONE ===");
}

main().catch(console.error);
