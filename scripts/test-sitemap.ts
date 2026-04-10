import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: "chromium",
    args: ["--headless=new", "--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const page = await context.newPage();

  // Get sitemap  
  await page.goto("https://www.buckedup.com/sitemap.xml", { waitUntil: "domcontentloaded", timeout: 30000 });
  try {
    await page.waitForFunction(() => document.title !== "Just a moment..." && document.title !== "", { timeout: 15000 });
  } catch {}
  await page.waitForTimeout(5000);

  // Extract all URLs from sitemap
  const urls = await page.evaluate(() => {
    const locs = document.querySelectorAll("loc");
    return Array.from(locs).map(l => l.textContent?.trim()).filter(Boolean) as string[];
  });

  console.log(`Total sitemap URLs: ${urls.length}`);
  
  // Categorize
  const shopUrls = urls.filter(u => new URL(u).pathname.startsWith("/shop/"));
  const rootUrls = urls.filter(u => { const p = new URL(u).pathname; return p !== "/" && !p.startsWith("/shop/"); });
  
  console.log(`/shop/* URLs: ${shopUrls.length}`);
  console.log(`Root-level URLs: ${rootUrls.length}`);
  
  console.log("\nSample /shop/ URLs:");
  shopUrls.slice(0, 30).forEach(u => console.log("  ", new URL(u).pathname));
  
  console.log("\nSample root URLs:");
  rootUrls.slice(0, 20).forEach(u => console.log("  ", new URL(u).pathname));

  // Also check /shop page for pagination/infinite scroll - how many products visible
  console.log("\n=== Checking /shop page product count ===");
  await page.goto("https://www.buckedup.com/shop", { waitUntil: "domcontentloaded", timeout: 30000 });
  try { await page.waitForFunction(() => document.title !== "Just a moment...", { timeout: 15000 }); } catch {}
  await page.waitForTimeout(5000);
  
  // Scroll down to load more
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  }
  
  const shopLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[href]")).map(a => {
      try { return new URL(a.getAttribute("href")!, window.location.origin).pathname; } catch { return null; }
    }).filter((l): l is string => l !== null && l.startsWith("/shop/"));
  });
  
  const uniqueShopLinks = [...new Set(shopLinks)];
  console.log(`Shop links found on /shop page after scrolling: ${uniqueShopLinks.length}`);
  console.log("Links:", uniqueShopLinks.slice(0, 40));

  await browser.close();
}

main().catch(console.error);
