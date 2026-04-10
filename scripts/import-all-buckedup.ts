import { chromium } from "playwright";
import { extractProductData } from "../src/lib/products/product-scraper";

async function main() {
  console.log("=== Full Bucked Up Import ===\n");
  const startTime = Date.now();

  const browser = await chromium.launch({
    headless: true, channel: "chromium",
    args: ["--headless=new", "--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });
  await context.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => false }); });
  const page = await context.newPage();

  // Step 1: Get ALL product URLs from sitemap
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

  console.log(`Found ${productUrls.length} product URLs\n`);

  // Step 2: Scrape ALL products
  console.log("Step 2: Scraping all products...");
  const products: { name: string; price: number | null; brand: string | null; url: string; description: string | null; images: { url: string; alt: string | null }[]; variants: { name: string; options: string[] }[]; supplementFacts: any[]; ingredients: string | null; servingSize: string | null; servingsPerContainer: number | null; warnings: string | null }[] = [];
  let scrapeErrors = 0;

  for (let i = 0; i < productUrls.length; i++) {
    const url = productUrls[i];
    const slug = new URL(url).pathname;
    
    if ((i + 1) % 10 === 0 || i === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`  [${i+1}/${productUrls.length}] ${elapsed}s elapsed, ${products.length} scraped, ${scrapeErrors} errors`);
    }
    
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      try { await page.waitForFunction(() => document.title !== "Just a moment...", { timeout: 15000 }); } catch {}
      await page.waitForTimeout(2500);
      const html = await page.content();
      const data = extractProductData(html, url);
      
      if (data.name) {
        products.push({
          name: data.name,
          price: data.price,
          brand: data.brand,
          url: data.sourceUrl,
          description: data.description,
          images: data.images,
          variants: data.variants,
          supplementFacts: data.supplementFacts,
          ingredients: data.ingredients,
          servingSize: data.servingSize,
          servingsPerContainer: data.servingsPerContainer,
          warnings: data.warnings,
        });
      } else {
        scrapeErrors++;
      }
    } catch {
      scrapeErrors++;
    }

    // Brief delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  const scrapeTime = Math.round((Date.now() - startTime) / 1000);
  console.log(`\nScraping complete in ${scrapeTime}s: ${products.length} products, ${scrapeErrors} errors\n`);

  // Step 3: Import ALL products
  console.log("Step 3: Importing all products...");
  let imported = 0;
  let importFailed = 0;
  const usedSkus = new Set<string>();

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    // Generate unique SKU
    let baseSku = ((product.brand || "BU") + "-" + product.name)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 45);
    let sku = baseSku;
    let suffix = 0;
    while (usedSkus.has(sku)) {
      suffix++;
      sku = baseSku + "-" + suffix;
    }
    usedSkus.add(sku);

    try {
      const res = await fetch("http://localhost:3000/api/products/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          sku,
          category: "SUPPLEMENT",
          retailPrice: product.price || 29.99,
          costOfGoods: 5.00,
          brand: product.brand || "Bucked Up",
          description: product.description || undefined,
          sourceUrl: product.url,
          imageUrl: product.images[0]?.url || undefined,
          variants: product.variants.length > 0 ? product.variants : undefined,
          servingSize: product.servingSize || undefined,
          servingsPerContainer: product.servingsPerContainer || undefined,
          ingredients: product.ingredients || undefined,
          supplementFacts: product.supplementFacts.length > 0 ? product.supplementFacts : undefined,
          warnings: product.warnings || undefined,
          images: product.images.map((img, idx) => ({
            url: img.url,
            alt: img.alt,
            isPrimary: idx === 0,
          })),
        }),
      });

      if (res.ok) {
        imported++;
      } else {
        importFailed++;
        if (importFailed <= 5) {
          const err = await res.json().catch(() => null);
          console.log(`  Import error for "${product.name}": ${err?.error || res.status}`);
        }
      }
    } catch {
      importFailed++;
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  Imported ${imported} / ${i + 1}...`);
    }
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n=== COMPLETE in ${totalTime}s ===`);
  console.log(`Scraped: ${products.length} products`);
  console.log(`Imported: ${imported} products`);
  console.log(`Failed: ${importFailed}`);

  // Verify
  const verifyRes = await fetch("http://localhost:3000/api/products");
  const verifyJson = await verifyRes.json();
  console.log(`\nTotal products in database: ${verifyJson.data?.length || 0}`);

  await browser.close();
}

main().catch(console.error);
