/**
 * Categorizes all imported products from buckedup.com into proper
 * category/subCategory based on product name and URL analysis.
 */

interface ProductInfo {
  id: string;
  name: string;
  sourceUrl: string | null;
  category: string;
  subCategory: string | null;
}

interface Classification {
  category: "SUPPLEMENT" | "APPAREL" | "ACCESSORY";
  subCategory: string;
}

function classifyProduct(name: string, url: string | null): Classification {
  const n = name.toLowerCase();
  const u = (url || "").toLowerCase();

  // ── APPAREL ──────────────────────────────────────────────

  // Shorts
  if (/\b(shorts?|bike\s*shorts?|mesh\s*shorts?|training\s*shorts?|jogger\s*shorts?|sweat\s*shorts?|golf\s*shorts?|birdie.*shorts?)\b/i.test(n)) {
    return { category: "APPAREL", subCategory: "Shorts" };
  }

  // Hoodies & Crewnecks
  if (/\b(hoodie|hoody|crewneck|crew\s*neck|sweater|pullover)\b/i.test(n)) {
    return { category: "APPAREL", subCategory: "Hoodie" };
  }

  // T-Shirts & Tops
  if (/\b(t-shirt|tee|t\s*shirt|shirt|crop|tank\s*top|tank|long\s*sleeve|muscle\s*tee|oversized\s*tee|graphic\s*tee|polo)\b/i.test(n)) {
    return { category: "APPAREL", subCategory: "Tee" };
  }
  if (/\bBCKD\b.*\b(t-shirt|up)\b/i.test(n)) {
    return { category: "APPAREL", subCategory: "Tee" };
  }

  // Hats & Headwear
  if (/\b(hat|cap|beanie|trucker|snapback|visor|headband|baseball\s*hat|panel.*hat|richardson)\b/i.test(n)) {
    return { category: "APPAREL", subCategory: "Hat" };
  }
  if (/\ba-frame\b/i.test(n)) {
    return { category: "APPAREL", subCategory: "Hat" };
  }

  // Joggers & Pants
  if (/\b(jogger|pant|legging|compression\s*legging|compression\s*biker)\b/i.test(n)) {
    return { category: "APPAREL", subCategory: "Other" };
  }

  // Socks
  if (/\b(sock|crew\s*sock)\b/i.test(n)) {
    return { category: "APPAREL", subCategory: "Other" };
  }

  // Activewear (generic name from scraper)
  if (/^activewear$/i.test(n.trim())) {
    // Check URL for more specific info
    if (/short/i.test(u)) return { category: "APPAREL", subCategory: "Shorts" };
    if (/jogger|pant/i.test(u)) return { category: "APPAREL", subCategory: "Other" };
    if (/hoodie/i.test(u)) return { category: "APPAREL", subCategory: "Hoodie" };
    if (/shirt|tee/i.test(u)) return { category: "APPAREL", subCategory: "Tee" };
    return { category: "APPAREL", subCategory: "Other" };
  }

  // ── ACCESSORIES ──────────────────────────────────────────

  // Shakers & Bottles
  if (/\b(shaker|bottle|water\s*bottle|insulated.*bottle|stainless.*shaker)\b/i.test(n)) {
    return { category: "ACCESSORY", subCategory: "Shaker" };
  }

  // Bags
  if (/\b(bag|backpack|duffel|tote|gym\s*bag)\b/i.test(n)) {
    return { category: "ACCESSORY", subCategory: "Bag" };
  }

  // Belts (lifting belts = gear)
  if (/\b(belt|lifting\s*belt|leather\s*belt|foam.*belt)\b/i.test(n)) {
    return { category: "ACCESSORY", subCategory: "Gear" };
  }

  // Bands (resistance bands, booty bands)
  if (/\b(band|booty\s*band|resistance\s*band|wrist\s*strap|strap|wrap|knee\s*sleeve|lifting\s*strap|wrist\s*wrap)\b/i.test(n)) {
    return { category: "ACCESSORY", subCategory: "Gear" };
  }

  // Towels
  if (/\b(towel)\b/i.test(n)) {
    return { category: "ACCESSORY", subCategory: "Other" };
  }

  // Stickers, patches, misc gear
  if (/\b(sticker|patch|pin|keychain|flag|banner|poster)\b/i.test(n)) {
    return { category: "ACCESSORY", subCategory: "Other" };
  }

  // ── SUPPLEMENTS ──────────────────────────────────────────

  // Pre-Workout
  if (/\b(pre-workout|pre\s*workout|preworkout|bamf|woke\s*af|mother\s*bucker|lfg|black\s*ant|big\s*bucks|pump-ocalypse|pump\s*ocalypse)\b/i.test(n)) {
    return { category: "SUPPLEMENT", subCategory: "Pre-Workout" };
  }
  // Specific pre-workout products by name
  if (/\bbucked\s*up\s*(pre|original|pre-workout)\b/i.test(n)) {
    return { category: "SUPPLEMENT", subCategory: "Pre-Workout" };
  }

  // Protein
  if (/\b(protein|whey|casein|isolate|mass\s*gainer|protein\s*soda|collagen\s*peptide)\b/i.test(n)) {
    return { category: "SUPPLEMENT", subCategory: "Protein" };
  }

  // Amino Acids & BCAAs
  if (/\b(amino|bcaa|eaa|glutamine|creatine)\b/i.test(n)) {
    return { category: "SUPPLEMENT", subCategory: "Amino" };
  }

  // Vitamins & Health
  if (/\b(vitamin|multi-vitamin|multivitamin|mineral|omega|fish\s*oil|probiotic|greens|super\s*greens|organic\s*greens)\b/i.test(n)) {
    return { category: "SUPPLEMENT", subCategory: "Vitamin" };
  }

  // Health & Wellness
  if (/\b(deer\s*antler|antler\s*spray|testosterone|rut|hormone|sleep|melatonin|immune|heart\s*health|joint|flex\s*bone|digest|gut|liver|kidney|prostate|blood\s*sugar|apple\s*cider|turmeric|ashwagandha|nootropic|brain\s*gainz|focus|mood|stress)\b/i.test(n)) {
    return { category: "SUPPLEMENT", subCategory: "Health" };
  }

  // Recovery
  if (/\b(recovery|recover|post-workout|post\s*workout|hydration|electrolyte|rehydr)\b/i.test(n)) {
    return { category: "SUPPLEMENT", subCategory: "Recovery" };
  }

  // Weight Management / Fat Burners
  if (/\b(burn|fat\s*burn|thermogenic|weight|lean|cut|shred|diet|detox|bloat|calorie)\b/i.test(n)) {
    return { category: "SUPPLEMENT", subCategory: "Health" };
  }

  // Energy Drinks
  if (/\b(energy\s*drink|energy\s*case|buck\s*shot|refresher)\b/i.test(n)) {
    return { category: "SUPPLEMENT", subCategory: "Other" };
  }

  // Stacks / Bundles (supplements)
  if (/\b(stack|bundle|combo|sample\s*pack|variety\s*pack|starter\s*kit)\b/i.test(n)) {
    return { category: "SUPPLEMENT", subCategory: "Other" };
  }

  // Candy / Edibles
  if (/\b(candy|gummies|gummy|chew|bar|snack|creatine\s*candy)\b/i.test(n)) {
    return { category: "SUPPLEMENT", subCategory: "Other" };
  }

  // Check URL for more clues
  if (u) {
    if (/shirt|tee|hoodie|hat|cap|short|jogger|legging|apparel|clothing/i.test(u)) {
      return { category: "APPAREL", subCategory: "Other" };
    }
    if (/shaker|bottle|belt|band|strap|gear|accessory/i.test(u)) {
      return { category: "ACCESSORY", subCategory: "Other" };
    }
    if (/pre-workout|protein|amino|creatine|vitamin|supplement|energy/i.test(u)) {
      return { category: "SUPPLEMENT", subCategory: "Other" };
    }
  }

  // Default: if the name has supplement-like keywords
  if (/\b(mg|capsule|tablet|powder|scoop|serving|formula|supplement|nutrient|absorption)\b/i.test(n)) {
    return { category: "SUPPLEMENT", subCategory: "Other" };
  }

  // Default to supplement (most buckedup products are supplements)
  return { category: "SUPPLEMENT", subCategory: "Other" };
}

async function main() {
  console.log("=== Product Categorization ===\n");

  // Fetch all products
  const res = await fetch("http://localhost:3000/api/products");
  const json = await res.json();
  const products: ProductInfo[] = json.data || [];
  console.log(`Total products: ${products.length}\n`);

  // Classify each product
  const updates: { id: string; category: string; subCategory: string; name: string }[] = [];
  const stats: Record<string, Record<string, number>> = {};

  for (const product of products) {
    const classification = classifyProduct(product.name, product.sourceUrl);

    // Track stats
    if (!stats[classification.category]) stats[classification.category] = {};
    if (!stats[classification.category][classification.subCategory]) {
      stats[classification.category][classification.subCategory] = 0;
    }
    stats[classification.category][classification.subCategory]++;

    updates.push({
      id: product.id,
      category: classification.category,
      subCategory: classification.subCategory,
      name: product.name,
    });
  }

  // Print stats
  console.log("=== Classification Summary ===");
  for (const [cat, subs] of Object.entries(stats).sort()) {
    const total = Object.values(subs).reduce((a, b) => a + b, 0);
    console.log(`\n${cat} (${total} products):`);
    for (const [sub, count] of Object.entries(subs).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${sub}: ${count}`);
    }
  }

  // Print some examples for each category
  console.log("\n=== Sample Classifications ===");
  for (const [cat, subs] of Object.entries(stats).sort()) {
    for (const sub of Object.keys(subs).sort()) {
      const examples = updates.filter(u => u.category === cat && u.subCategory === sub).slice(0, 3);
      console.log(`\n${cat} > ${sub}:`);
      examples.forEach(e => console.log(`  - ${e.name}`));
    }
  }

  // Apply updates
  console.log("\n=== Applying Updates ===");
  let updated = 0;
  let failed = 0;

  for (const update of updates) {
    try {
      const res = await fetch(`http://localhost:3000/api/products/${update.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: update.category,
          subCategory: update.subCategory,
        }),
      });

      if (res.ok) {
        updated++;
      } else {
        failed++;
        if (failed <= 5) {
          const err = await res.json().catch(() => null);
          console.log(`  Failed: ${update.name} - ${err?.error || res.status}`);
        }
      }
    } catch (err) {
      failed++;
    }

    if (updated % 50 === 0 && updated > 0) {
      console.log(`  Updated ${updated}...`);
    }
  }

  console.log(`\nDone! Updated ${updated} products, ${failed} failed.`);
}

main().catch(console.error);
