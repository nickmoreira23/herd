import Anthropic from "@anthropic-ai/sdk";
import type { ParsedFeedEntry } from "./rss-parser";
import { resolveAnthropicKey } from "@/lib/integrations";

/**
 * Checks whether a feed entry matches the user's include/exclude keyword filters.
 * This is the fast, deterministic pre-filter — no API calls.
 */
export function matchesKeywordFilters(
  entry: ParsedFeedEntry,
  includeKeywords: string[],
  excludeKeywords: string[]
): boolean {
  const searchText = [
    entry.title,
    entry.summary || "",
    ...entry.categories,
  ]
    .join(" ")
    .toLowerCase();

  // Exclude check first — any match rejects
  if (excludeKeywords.length > 0) {
    for (const keyword of excludeKeywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return false;
      }
    }
  }

  // Include check — at least one must match (empty = all pass)
  if (includeKeywords.length > 0) {
    return includeKeywords.some((keyword) =>
      searchText.includes(keyword.toLowerCase())
    );
  }

  return true;
}

/**
 * Uses Claude to evaluate which articles match the user's natural language instructions.
 * Batches articles together in a single API call for efficiency.
 * Returns the indices of matching articles.
 */
export async function filterByInstructions(
  entries: ParsedFeedEntry[],
  instructions: string
): Promise<Set<number>> {
  if (entries.length === 0) return new Set();

  let apiKey: string;
  try {
    apiKey = await resolveAnthropicKey();
  } catch {
    console.warn("Anthropic API key not configured — skipping AI filter, passing all entries");
    return new Set(entries.map((_, i) => i));
  }

  const client = new Anthropic({ apiKey });

  // Build the article list for the prompt
  const articleList = entries
    .map((entry, i) => {
      const parts = [
        `[${i}] "${entry.title}"`,
        entry.author ? `   Author: ${entry.author}` : null,
        entry.summary ? `   Summary: ${entry.summary.slice(0, 300)}` : null,
        entry.categories.length > 0
          ? `   Categories: ${entry.categories.join(", ")}`
          : null,
        entry.publishedAt
          ? `   Published: ${entry.publishedAt.toISOString().split("T")[0]}`
          : null,
      ];
      return parts.filter(Boolean).join("\n");
    })
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `You are an article relevance filter for an RSS feed aggregator. The user has described what kinds of articles they want to collect. You will be given a numbered list of articles (title, summary, categories). Your job is to decide which articles match the user's intent.

Respond ONLY with a JSON array of the matching article indices. Example: [0, 2, 5]

If none match, respond with: []

Be inclusive rather than exclusive — if an article seems even somewhat relevant to the user's described interests, include it. The user can always remove articles later, but they can't get back articles you filtered out.`,
    messages: [
      {
        role: "user",
        content: `## My Instructions
${instructions}

## Articles to Evaluate
${articleList}

Which article indices match my instructions? Respond with only a JSON array.`,
      },
    ],
  });

  // Parse the response
  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    // Extract JSON array from response (handle potential markdown wrapping)
    const match = text.match(/\[[\d\s,]*\]/);
    if (!match) return new Set();
    const indices: number[] = JSON.parse(match[0]);
    return new Set(indices.filter((i) => i >= 0 && i < entries.length));
  } catch {
    console.warn("Failed to parse AI filter response:", text);
    // On parse failure, pass all entries through rather than blocking everything
    return new Set(entries.map((_, i) => i));
  }
}
