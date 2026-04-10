import { chromium } from "playwright";
import { extractProductData } from "../src/lib/products/product-scraper";

/**
 * End-to-end test: discover all products from buckedup.com via sitemap,
 * scrape them, then import them via the API.
 */
async function main() {
  console.log("=== E2E Test: Bucked Up Full Import ===\n");

  const browser = await chromium.launch({
    headless: true, channel: "chromium",
    args: ["--headless=new", "--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });
  await context.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => false }); });
  const page = await context.newPage();

  // Step 1: Get sitemap
  console.log("Step 1: Fetching sitemap...");
  await page.goto("https://www.buckedup.com/sitemap.xml", { waitUntil: "domcontentloaded", timeout: 30000 });
  try { await page.waitForFunction(() => document.title !== "Just a moment...", { timeout: 15000 }); } catch {}
  await page.waitForTimeout(5000);

  const sitemapUrls = await page.evaluate(() => {
    const locs = document.querySelectorAll("loc");
    return Array.from(locs).map(l => l.textContent?.trim()).filter(Boolean) as string[];
  });

  const productUrls = sitemapUrls.filter(u => {
    const path = new URL(u).pathname.toLowerCase();
    if (path === "/") return false;
    if (/\/(cart|checkout|account|login|search|blog|faq|about|contact|privacy|terms|policy|shipping|returns|help|support|sitemap)/i.test(path)) return false;
    const segs = path.split("/").filter(Boolean);
    if (segs.length === 1 && segs[0].includes("-") && segs[0].length > 10) {
      if (/^(subscribe|become|wholesale|terms|castaway|referral|ambassador)/i.test(segs[0])) return false;
      return true;
    }
    return false;
  });

  console.log(`Found ${productUrls.length} product URLs in sitemap`);

  // Step 2: Scrape first 20 products
  const toScrape = productUrls.slice(0, 20);
  console.log(`\nStep 2: Scraping ${toScrape.length} products...`);
  
  const scraped: { name: string; price: number; brand: string | null; url: string; images: number }[] = [];
  let errors = 0;

  for (let i = 0; i < toScrape.length; i++) {
    const url = toScrape[i];
    const slug = new URL(url).pathname;
    process.stdout.write(`  [${i+1}/${toScrape.length}] ${slug.slice(0, 50)}...`);
    
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      try { await page.waitForFunction(() => document.title !== "Just a moment...", { timeout: 15000 }); } catch {}
      await page.waitForTimeout(3000);
      const html = await page.content();
      const data = extractProductData(html, url);
      
      if (data.name) {
        scraped.push({ name: data.name, price: data.price ?? 0, brand: data.brand, url, images: data.images.length });
        console.log(` ✓ ${data.name} ($${data.price})`);
      } else {
        errors++;
        console.log(` ✗ No data`);
      }
    } catch (err) {
      errors++;
      console.log(` ✗ ${err instanceof Error ? err.message : "Error"}`);
    }
  }

  console.log(`\nResults: ${scraped.length} scraped, ${errors} errors`);
  
  // Step 3: Import via API
  console.log(`\nStep 3: Importing ${scraped.length} products via API...`);
  let imported = 0;
  let importFailed = 0;

  for (const product of scraped) {
    const sku = (product.brand ? product.brand + "-" : "") + product.name;
    const skuClean = sku.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
    
    try {
      const res = await fetch("http://localhost:3000/api/products/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          sku: skuClean + "-" + imported,
          category: "SUPPLEMENT",
          retailPrice: product.price || 29.99,
          costOfGoods: 5.00,
          brand: product.brand || "Bucked Up",
          sourceUrl: product.url,
        }),
      });

      if (res.ok) {
        imported++;
        process.stdout.write(".");
      } else {
        importFailed++;
        const err = await res.json().catch(() => null);
        process.stdout.write("X");
        if (importFailed <= 3) console.log(`\n  Import error: ${err?.error || res.status}`);
      }
    } catch (err) {
      importFailed++;
      process.stdout.write("X");
    }
  }

  console.log(`\n\nImport complete: ${imported} imported, ${importFailed} failed`);

  await browser.close();
  
  // Step 4: Verify
  console.log("\nStep 4: Verifying products in database...");
  const verifyRes = await fetch("http://localhost:3000/api/products");
  const verifyJson = await verifyRes.json();
  console.log(`Total products in database: ${verifyJson.data?.length || 0}`);
}

main().catch(console.error);
