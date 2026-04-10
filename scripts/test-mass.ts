import { chromium } from "playwright";
import * as cheerio from "cheerio";

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

  await page.goto("https://www.buckedup.com/two-case-custom-protein-energy-bundle", { waitUntil: "domcontentloaded", timeout: 30000 });
  try { await page.waitForFunction(() => document.title !== "Just a moment...", { timeout: 15000 }); } catch {}
  await page.waitForTimeout(4000);
  const html = await page.content();
  const $ = cheerio.load(html);

  console.log("H1:", $("h1").first().text().trim());
  console.log("Title:", $("title").text().trim());
  console.log(".product-title:", $(".product-title").first().text().trim());
  
  // Check all script tags for product name
  $("script:not([src])").each((_, el) => {
    const content = $(el).html() || "";
    if (content.includes('"product"')) {
      // Get the product name from embedded JSON
      const nameMatch = content.match(/"product"\s*:\s*\{[^}]*?"name"\s*:\s*"([^"]+)"/);
      if (nameMatch) console.log("Embedded name:", nameMatch[1]);
      
      // Find the full product object
      const objMatch = content.match(/"product"\s*:\s*(\{[\s\S]*?\})(?=\s*[,}])/);
      if (objMatch) {
        try {
          const data = JSON.parse(objMatch[1]);
          console.log("Parsed product:", { name: data.name, id: data.id });
        } catch {
          console.log("Could not parse product JSON (likely nested objects)");
          // Try to extract just the name from the partial match
          const smallMatch = content.match(/"product"\s*:\s*\{"id"\s*:\s*"[^"]*"\s*,\s*"name"\s*:\s*"([^"]+)"/);
          if (smallMatch) console.log("Name from regex:", smallMatch[1]);
        }
      }
    }
  });

  // Check visible product name near the top
  console.log("\nAll h1-h3 headings:");
  $("h1, h2, h3").each((i, el) => {
    const text = $(el).text().trim();
    if (text && i < 10) console.log(`  ${el.tagName}: "${text.slice(0, 80)}"`);
  });

  await browser.close();
}

main().catch(console.error);
