import type { CheerioAPI } from "cheerio";
import type { PartialScrapedData, SupplementFactLine } from "../types";

/**
 * Extracts supplement-specific data: supplement facts table, ingredients,
 * serving info, and warnings. Targeted at nutrition/supplement product pages.
 */
export function extractSupplementFacts($: CheerioAPI): PartialScrapedData {
  const result: PartialScrapedData = {};

  // Find the supplement/nutrition facts section
  const factsContainer = findFactsContainer($);

  if (factsContainer) {
    // Serving info
    const servingInfo = extractServingInfo($, factsContainer);
    if (servingInfo.servingSize) result.servingSize = servingInfo.servingSize;
    if (servingInfo.servingsPerContainer) result.servingsPerContainer = servingInfo.servingsPerContainer;

    // Supplement facts lines
    const facts = extractFactLines($, factsContainer);
    if (facts.length > 0) result.supplementFacts = facts;
  }

  // If no facts found via container, try extracting from formula/ingredient tabs
  if (!result.supplementFacts || result.supplementFacts.length === 0) {
    const formulaFacts = extractFromFormulaTabs($);
    if (formulaFacts.length > 0) result.supplementFacts = formulaFacts;
  }

  // Ingredients (often outside the facts table)
  const ingredients = extractIngredients($);
  if (ingredients) result.ingredients = ingredients;

  // Warnings
  const warnings = extractWarnings($);
  if (warnings) result.warnings = warnings;

  return result;
}

function findFactsContainer($: CheerioAPI): string | null {
  // Look for elements containing "Supplement Facts" or "Nutrition Facts"
  const headingSelectors = [
    "h1, h2, h3, h4, h5, h6",
    ".supplement-facts",
    ".nutrition-facts",
    "#supplement-facts",
    "#nutrition-facts",
    "[data-supplement-facts]",
    "strong, b",
    "th",
    "td",
    "p",
    "div",
    "span",
  ];

  for (const selector of headingSelectors) {
    const elements = $(selector);
    let found: string | null = null;

    elements.each((_, el) => {
      if (found) return;
      const text = $(el).text().trim();
      if (/supplement\s+facts|nutrition\s+facts/i.test(text)) {
        // Try to find the containing section/table
        const table = $(el).closest("table");
        if (table.length) {
          found = "table" + (table.attr("class") ? `.${table.attr("class")!.split(" ")[0]}` : "");
          return;
        }

        // Try parent containers
        const parent = $(el).closest("section, .supplement-facts, .nutrition-facts, .product-tabs__content, .tab-content, [data-tab], .accordion-content, div");
        if (parent.length) {
          // Use the parent's outer HTML tag for reference
          found = getElementSelector($, parent);
        }
      }
    });

    if (found) return found;
  }

  return null;
}

function getElementSelector($: CheerioAPI, el: ReturnType<CheerioAPI>): string {
  const id = el.attr("id");
  if (id) return `#${id}`;
  const cls = el.attr("class");
  if (cls) return `.${cls.split(" ")[0]}`;
  return el.prop("tagName")?.toLowerCase() || "div";
}

function extractServingInfo(
  $: CheerioAPI,
  _containerSelector: string
): { servingSize: string | null; servingsPerContainer: number | null } {
  const result = { servingSize: null as string | null, servingsPerContainer: null as number | null };

  // Search the entire page for serving info near supplement facts
  const bodyText = $("body").text();

  // Serving Size
  const servingSizeMatch = bodyText.match(/serving\s+size[:\s]*([^\n\r]+)/i);
  if (servingSizeMatch) {
    result.servingSize = servingSizeMatch[1].trim()
      .replace(/\s+/g, " ")
      .replace(/servings?\s+per\s+container.*/i, "")
      .trim();
  }

  // Servings Per Container
  const servingsMatch = bodyText.match(/servings?\s+per\s+container[:\s]*(\d+)/i);
  if (servingsMatch) {
    result.servingsPerContainer = parseInt(servingsMatch[1], 10);
  }

  return result;
}

function extractFactLines($: CheerioAPI, containerSelector: string): SupplementFactLine[] {
  const facts: SupplementFactLine[] = [];
  const seen = new Set<string>();

  // Try to find tables with supplement data
  const tables = $(containerSelector).length
    ? $(containerSelector).find("table").add($(containerSelector).filter("table"))
    : $("table");

  tables.each((_, table) => {
    const tableText = $(table).text();
    if (!/supplement\s+facts|nutrition\s+facts|amount|daily\s+value/i.test(tableText)) return;

    $(table).find("tr").each((__, row) => {
      const cells = $(row).find("td, th");
      if (cells.length < 2) return;

      const firstCell = $(cells[0]).text().trim();
      const secondCell = $(cells[1]).text().trim();

      // Skip headers
      if (/amount|daily\s+value|%\s*dv|serving/i.test(firstCell) && /amount|daily\s+value|%\s*dv/i.test(secondCell)) return;

      const parsed = parseFactLine(firstCell, secondCell, cells.length > 2 ? $(cells[2]).text().trim() : null);
      if (parsed && !seen.has(parsed.name.toLowerCase())) {
        seen.add(parsed.name.toLowerCase());
        facts.push(parsed);
      }
    });
  });

  // If no table found, try parsing from text content
  if (facts.length === 0) {
    const container = $(containerSelector);
    if (container.length) {
      const text = container.text();
      const lines = text.split(/\n|\r/).map((l) => l.trim()).filter(Boolean);

      for (const line of lines) {
        // Pattern: "Ingredient Name 300mg 50%"
        const match = line.match(/^([A-Za-z][A-Za-z\s\(\)]+?)\s+([\d,.]+\s*(?:mg|g|mcg|µg|iu|ml|%|calories|kcal))\s*(\d+%)?/i);
        if (match) {
          const name = match[1].trim();
          if (seen.has(name.toLowerCase())) continue;
          if (/serving|amount|daily|supplement|nutrition/i.test(name)) continue;

          const { amount, unit } = parseAmountUnit(match[2]);
          seen.add(name.toLowerCase());
          facts.push({
            name,
            amount,
            unit,
            dailyValue: match[3] || null,
          });
        }
      }
    }
  }

  return facts;
}

function parseFactLine(
  nameCell: string,
  amountCell: string,
  dvCell: string | null
): SupplementFactLine | null {
  // Clean up the name
  const name = nameCell
    .replace(/[†‡§*]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!name || name.length < 2) return null;
  if (/^(amount|daily|%|serving|\s)*$/i.test(name)) return null;

  // Parse amount and unit
  const { amount, unit } = parseAmountUnit(amountCell);

  // Daily value
  let dailyValue: string | null = null;
  if (dvCell) {
    const dvMatch = dvCell.match(/(\d+%)/);
    if (dvMatch) dailyValue = dvMatch[1];
  } else {
    // DV might be in the amount cell
    const dvMatch = amountCell.match(/(\d+%)/);
    if (dvMatch) dailyValue = dvMatch[1];
  }

  return { name, amount, unit, dailyValue };
}

function parseAmountUnit(text: string): { amount: string; unit: string } {
  const cleaned = text.replace(/[†‡§*]+/g, "").trim();
  const match = cleaned.match(/^([\d,.]+)\s*(mg|g|mcg|µg|iu|ml|calories|kcal|%)?/i);
  if (match) {
    return {
      amount: match[1],
      unit: (match[2] || "").toLowerCase(),
    };
  }
  return { amount: cleaned, unit: "" };
}

/**
 * Extract supplement facts from formula/ingredient tabs.
 * Common in supplement sites like Bucked Up where ingredients are shown
 * with bold text like "Citrulline Malate 2:1 (6,000 mg)".
 */
function extractFromFormulaTabs($: CheerioAPI): SupplementFactLine[] {
  const facts: SupplementFactLine[] = [];
  const seen = new Set<string>();

  // Search tab panels, accordion content, and product description areas
  const tabSelectors = [
    "#tab-formula",
    "[data-tab='formula']",
    "#formula",
    ".formula-tab",
    "#tab-ingredients",
    "[data-tab='ingredients']",
    ".tab-content",
    ".tabs-content",
    "[role='tabpanel']",
    ".product-description",
    ".product-details",
  ];

  for (const sel of tabSelectors) {
    $(sel).each((_, panel) => {
      const panelText = $(panel).text();
      // Only process panels that look like they contain ingredient data
      if (!/mg|mcg|g\b|iu\b/i.test(panelText)) return;

      // Look for bold text with dosage info: "Ingredient Name (X,XXX mg)"
      $(panel).find("strong, b, span[style*='font-weight: 700'], span[style*='font-weight:700'], span[style*='bold']").each((__, el) => {
        const text = $(el).text().trim();
        // Pattern: "Name (amount unit)" or "Name amount unit"
        const match = text.match(/^([A-Za-z][A-Za-z0-9\s:()®™-]+?)\s*\(?\s*([\d,]+(?:\.\d+)?)\s*(mg|g|mcg|µg|iu|ml)\s*\)?$/i);
        if (match) {
          const name = match[1].trim().replace(/\s+/g, " ");
          if (seen.has(name.toLowerCase())) return;
          if (name.length < 2 || /serving|amount|daily/i.test(name)) return;

          seen.add(name.toLowerCase());
          facts.push({
            name,
            amount: match[2].replace(",", ""),
            unit: match[3].toLowerCase(),
            dailyValue: null,
          });
        }
      });
    });

    if (facts.length > 0) break;
  }

  // Also scan the entire body for bold dosage patterns if nothing found yet
  if (facts.length === 0) {
    $("strong, b").each((_, el) => {
      const text = $(el).text().trim();
      const match = text.match(/^([A-Za-z][A-Za-z0-9\s:()®™-]+?)\s*\(?\s*([\d,]+(?:\.\d+)?)\s*(mg|g|mcg|µg|iu|ml)\s*\)?$/i);
      if (match) {
        const name = match[1].trim().replace(/\s+/g, " ");
        if (seen.has(name.toLowerCase())) return;
        if (name.length < 2 || /serving|amount|daily|warning|caution/i.test(name)) return;

        seen.add(name.toLowerCase());
        facts.push({
          name,
          amount: match[2].replace(",", ""),
          unit: match[3].toLowerCase(),
          dailyValue: null,
        });
      }
    });
  }

  return facts;
}

function extractIngredients($: CheerioAPI): string | null {
  // Common patterns for ingredient listings
  const patterns = [
    /other\s+ingredients[:\s]*([\s\S]*?)(?=\n\s*\n|warnings?|caution|manufactured|allergen|\*|$)/i,
    /ingredients[:\s]*([\s\S]*?)(?=\n\s*\n|warnings?|caution|manufactured|allergen|supplement\s+facts|\*|$)/i,
  ];

  // Try looking at specific elements first
  const ingredientSelectors = [
    ".ingredients",
    "#ingredients",
    "[data-ingredients]",
    ".product-ingredients",
    "#tab-formula",
    "[data-tab='formula']",
    "#formula",
    ".formula-tab",
    ".tab-content[id*='formula']",
    ".tab-pane[id*='formula']",
    "#tab-ingredients",
    "[data-tab='ingredients']",
  ];

  for (const selector of ingredientSelectors) {
    const el = $(selector).first();
    if (el.length) {
      const text = el.text().trim();
      if (text.length > 10) {
        return cleanIngredients(text);
      }
    }
  }

  // Try to find formula/ingredient content in tab panels
  $(".tab-content, .tabs-content, [class*='tab-panel'], [role='tabpanel']").each((_, panel) => {
    const text = $(panel).text().trim();
    if (/formula|ingredient/i.test(text) && text.length > 30) {
      // Look for bold-text ingredient patterns (e.g., "Citrulline Malate 2:1 (6,000 mg)")
      const boldIngredients: string[] = [];
      $(panel).find("strong, b, span[style*='font-weight']").each((__, el) => {
        const t = $(el).text().trim();
        if (t.length > 3 && /\d/.test(t) && /mg|g|mcg|iu/i.test(t)) {
          boldIngredients.push(t);
        }
      });
      if (boldIngredients.length > 0) {
        return false; // Found ingredients, handled through supplementFacts extraction
      }
    }
  });

  // Fall back to text pattern matching — but only in product-related sections
  // Search within product description / details containers, NOT the entire body (avoids FAQ content)
  const productSections = [
    ".product-description",
    ".product-details",
    ".product-info",
    "[class*='product-tab']",
    ".tab-content",
    "[role='tabpanel']",
  ];

  for (const sel of productSections) {
    const sectionText = $(sel).text();
    if (!sectionText) continue;
    for (const pattern of patterns) {
      const match = sectionText.match(pattern);
      if (match && match[1]) {
        const text = match[1].trim();
        if (!looksLikeIngredientList(text)) continue;
        if (text.length > 10 && text.length < 5000) {
          return cleanIngredients(text);
        }
      }
    }
  }

  // Last resort: body text, but require the match to look like a real ingredient list
  const bodyText = $("body").text();
  for (const pattern of patterns) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      const text = match[1].trim();
      if (!looksLikeIngredientList(text)) continue;
      if (text.length > 10 && text.length < 5000) {
        return cleanIngredients(text);
      }
    }
  }

  return null;
}

/**
 * Validates that text looks like an actual ingredient list, not marketing copy.
 * Real ingredient lists are comma-separated chemical/ingredient names.
 * Marketing copy has full sentences, verbs, and promotional language.
 */
function looksLikeIngredientList(text: string): boolean {
  // Skip if starts with non-alphanumeric (like "; the rest..." or ". We revolutionized...")
  if (/^[^A-Za-z]/.test(text)) return false;
  // Skip if contains conversational/marketing language
  if (/the rest is the same|FAQ|which are for|you have|redefine|revolutionized|discover|switching to|try and keep up/i.test(text)) return false;
  // Real ingredient lists usually have commas (comma-separated)
  const commaCount = (text.match(/,/g) || []).length;
  // If it's long enough and has no commas, it's probably a sentence/paragraph, not a list
  if (text.length > 50 && commaCount === 0) return false;
  return true;
}

function cleanIngredients(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n+/g, ", ")
    .replace(/,\s*,/g, ",")
    .trim()
    .replace(/[,.\s]+$/, "");
}

function extractWarnings($: CheerioAPI): string | null {
  const patterns = [
    /warnings?[:\s]*([\s\S]*?)(?=\n\s*\n|ingredients|manufactured by|\*\s*these|$)/i,
    /caution[:\s]*([\s\S]*?)(?=\n\s*\n|ingredients|manufactured by|\*\s*these|$)/i,
  ];

  // Try specific elements
  const warningSelectors = [".warnings", "#warnings", "[data-warnings]", ".product-warnings"];
  for (const selector of warningSelectors) {
    const el = $(selector).first();
    if (el.length) {
      const text = el.text().trim();
      if (text.length > 10) return text.replace(/\s+/g, " ").slice(0, 2000);
    }
  }

  // Fall back to text pattern matching
  const bodyText = $("body").text();
  for (const pattern of patterns) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      const text = match[1].trim();
      if (text.length > 10 && text.length < 2000) {
        return text.replace(/\s+/g, " ");
      }
    }
  }

  return null;
}
