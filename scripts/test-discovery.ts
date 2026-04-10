import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: "chromium",
    args: ["--headless=new", "--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const page = await context.newPage();

  console.log("=== Trying /shop ===");
  await page.goto("https://www.buckedup.com/shop", { waitUntil: "domcontentloaded", timeout: 30000 });
  
  try {
    await page.waitForFunction(() => document.title !== "Just a moment..." && document.title !== "", { timeout: 15000 });
  } catch { console.log("Cloudflare challenge timeout on /shop"); }
  
  await page.waitForTimeout(5000);
  console.log("Title:", await page.title());
  
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[href]")).map(a => {
      const href = a.getAttribute("href")!;
      try { return new URL(href, window.location.origin).pathname; } catch { return href; }
    }).filter(Boolean);
  });
  
  const uniqueLinks = [...new Set(links)];
  const productLinks = uniqueLinks.filter(l => {
    if (/\.(css|js|json|xml|png|jpg|webp|gif|svg)$/i.test(l)) return false;
    if (/\/(cart|checkout|account|login|search|blog|faq|about|contact|privacy|terms|policy)/i.test(l)) return false;
    if (l === "/") return false;
    // Product patterns
    if (/\/products?\/[^/]+$/.test(l)) return true;
    // Flat URLs with hyphens
    const segs = l.split("/").filter(Boolean);
    if (segs.length === 1 && segs[0].includes("-") && segs[0].length > 15) return true;
    return false;
  });
  
  const categoryLinks = uniqueLinks.filter(l => /\/shop\/[^/]+$/i.test(l));
  
  console.log(`Total unique links: ${uniqueLinks.length}`);
  console.log(`Product-like links: ${productLinks.length}`);
  console.log("Product links:", productLinks.slice(0, 30));
  console.log(`\nCategory links: ${categoryLinks.length}`);
  console.log("Categories:", categoryLinks.slice(0, 20));

  // Now try sitemap via playwright  
  console.log("\n=== Trying sitemap.xml via Playwright ===");
  await page.goto("https://www.buckedup.com/sitemap.xml", { waitUntil: "domcontentloaded", timeout: 30000 });
  try {
    await page.waitForFunction(() => document.title !== "Just a moment..." && document.title !== "", { timeout: 15000 });
  } catch { console.log("Cloudflare timeout on sitemap"); }
  await page.waitForTimeout(3000);
  const sitemapTitle = await page.title();
  console.log("Sitemap page title:", sitemapTitle);
  const sitemapText = await page.evaluate(() => document.body?.innerText?.slice(0, 500));
  console.log("Sitemap content:", sitemapText);

  await browser.close();
}

main().catch(console.error);
