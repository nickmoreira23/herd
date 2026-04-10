import { chromium } from "playwright";
import { extractProductData } from "../src/lib/products/product-scraper";

async function main() {
  const browser = await chromium.launch({
    headless: true, channel: "chromium",
    args: ["--headless=new", "--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });
  await context.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => false }); });
  const page = await context.newPage();

  const testUrls = [
    "https://www.buckedup.com/two-case-custom-protein-energy-bundle",
    "https://www.buckedup.com/bamf-all-natural-pre-workout",
    "https://www.buckedup.com/bucked-up-all-natural-pre-workout",
    "https://www.buckedup.com/5-inch-mesh-shorts",
    "https://www.buckedup.com/bucked-up-all-bulk-no-bloat",
    "https://www.buckedup.com/pre-workout-supplement",
  ];

  for (const url of testUrls) {
    const slug = new URL(url).pathname;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    try { await page.waitForFunction(() => document.title !== "Just a moment...", { timeout: 15000 }); } catch {}
    await page.waitForTimeout(3000);
    const html = await page.content();
    const data = extractProductData(html, url);
    console.log(`${slug.padEnd(55)} → Name: "${data.name}" | $${data.price} | ${data.images.length} imgs`);
  }

  await browser.close();
}

main().catch(console.error);
