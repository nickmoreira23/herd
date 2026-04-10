import { chromium } from "playwright";
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
  const url = "https://www.buckedup.com/shop/pre-workout-supplement";
  console.log("Scraping:", url);
  
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  try { await page.waitForFunction(() => document.title !== "Just a moment...", { timeout: 15000 }); } catch {}
  await page.waitForTimeout(5000);
  
  const html = await page.content();
  console.log("HTML length:", html.length);
  console.log("Title:", await page.title());

  const data = extractProductData(html, url);
  console.log("\n=== Extracted Product Data ===");
  console.log("Name:", data.name);
  console.log("Brand:", data.brand);
  console.log("Price:", data.price);
  console.log("SKU:", data.sku);
  console.log("Description:", data.description?.slice(0, 100));
  console.log("Images:", data.images.length, data.images.slice(0, 3).map(i => i.url?.slice(0, 60)));
  console.log("Variants:", data.variants.length, data.variants.map(v => ({ name: v.name, opts: v.options.length })));
  console.log("Supplement facts:", data.supplementFacts.length);
  console.log("Ingredients:", data.ingredients?.slice(0, 100));
  
  await browser.close();
}

main().catch(console.error);
