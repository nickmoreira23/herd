import { chromium } from "playwright";
import * as cheerio from "cheerio";

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

  // Test a supplement product  
  await page.goto("https://www.buckedup.com/pre-workout-supplement", { waitUntil: "domcontentloaded", timeout: 30000 });
  try { await page.waitForFunction(() => document.title !== "Just a moment...", { timeout: 15000 }); } catch {}
  await page.waitForTimeout(4000);
  const html = await page.content();
  const $ = cheerio.load(html);

  // Check h1
  console.log("=== H1 ===");
  console.log($("h1").first().text().trim());
  
  // Check product-title
  console.log("\n=== .product-title ===");
  console.log($(".product-title").first().text().trim());

  // Check JSON-LD
  console.log("\n=== JSON-LD ===");
  $("script[type='application/ld+json']").each((_, el) => {
    try {
      const data = JSON.parse($(el).html()!);
      if (data["@type"] === "Product" || data.name) {
        console.log("Name:", data.name);
        console.log("Brand:", data.brand);
        console.log("Image:", typeof data.image === 'string' ? data.image?.slice(0, 80) : Array.isArray(data.image) ? data.image.length + ' images' : 'none');
      }
    } catch {}
  });

  // Check embedded product JSON
  console.log("\n=== Embedded Product JSON ===");
  $("script:not([src])").each((_, el) => {
    const content = $(el).html() || "";
    const match = content.match(/"product"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/);
    if (match) console.log("Embedded name:", match[1]);
    
    const priceMatch = content.match(/"price_value"\s*:\s*"?([\d.]+)"?/);
    if (priceMatch) console.log("Embedded price:", priceMatch[1]);
  });

  // Check images on page
  console.log("\n=== Product Images ===");
  const selectors = [".product-gallery img", ".product-images img", ".product-media img", "[class*='product-image'] img", "[class*='product-gallery'] img"];
  for (const sel of selectors) {
    const count = $(sel).length;
    if (count > 0) console.log(`${sel}: ${count} images`);
  }
  
  // Check all images with product in class/parent
  let imgCount = 0;
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (src && /product|cdn-cgi\/image/i.test(src)) {
      imgCount++;
      if (imgCount <= 5) console.log("Img:", src.slice(0, 100));
    }
  });
  console.log(`Total product-like images: ${imgCount}`);

  // Check page title
  console.log("\n=== Page Title ===");
  console.log($("title").text());

  await browser.close();
}

main().catch(console.error);
