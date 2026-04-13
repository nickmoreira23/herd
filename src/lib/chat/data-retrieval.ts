import type { ArtifactMeta, DataProvider, SearchParams, SearchResult, CatalogItem } from "./types";
// Knowledge-type block providers (split from monolithic KnowledgeProvider)
import { DocumentProvider } from "./providers/document.provider";
import { ImageProvider } from "./providers/image.provider";
import { VideoProvider } from "./providers/video.provider";
import { AudioProvider } from "./providers/audio.provider";
import { LinkProvider } from "./providers/link.provider";
import { TableProvider } from "./providers/table.provider";
import { FormProvider } from "./providers/form.provider";
import { FeedProvider } from "./providers/feed.provider";
import { AppProvider } from "./providers/app.provider";
// Foundation + other providers
import { ProductProvider } from "./providers/product.provider";
import { AgentProvider } from "./providers/agent.provider";
import { PerkProvider } from "./providers/perk.provider";
import { CommunityProvider } from "./providers/community.provider";
import { PartnerProvider } from "./providers/partner.provider";
import { MeetingProvider } from "./providers/meeting.provider";
import { EventProvider } from "./providers/event.provider";
import { LandingPageProvider } from "./providers/landing-page.provider";
import { MessageProvider } from "./providers/message.provider";

// ─── Provider Registry ─────────────────────────────────────────────
// To add a new domain, create a provider and add it here.

const providers: DataProvider[] = [
  // Knowledge-type blocks (9 individual providers)
  new DocumentProvider(),
  new ImageProvider(),
  new VideoProvider(),
  new AudioProvider(),
  new LinkProvider(),
  new TableProvider(),
  new FormProvider(),
  new FeedProvider(),
  new AppProvider(),
  // Foundation + other providers
  new ProductProvider(),
  new AgentProvider(),
  new PerkProvider(),
  new CommunityProvider(),
  new PartnerProvider(),
  new MeetingProvider(),
  new EventProvider(),
  new LandingPageProvider(),
  new MessageProvider(),
];

// Build a lookup: type string → provider instance
const typeToProvider = new Map<string, DataProvider>();
for (const provider of providers) {
  for (const type of provider.types) {
    typeToProvider.set(type, provider);
  }
}

// ─── Catalog ────────────────────────────────────────────────────────

export async function getDataCatalog(): Promise<string> {
  const allItems = await Promise.all(
    providers.map((p) => p.getCatalogItems())
  );

  // Group by domain, then by type within each domain
  const byDomain = new Map<string, CatalogItem[]>();
  for (const items of allItems) {
    for (const item of items) {
      const list = byDomain.get(item.domain) || [];
      list.push(item);
      byDomain.set(item.domain, list);
    }
  }

  const totalItems = allItems.reduce((sum, items) => sum + items.length, 0);
  if (totalItems === 0) {
    return "No data is available yet.";
  }

  const sections: string[] = [];

  // Knowledge base section
  const knowledgeItems = byDomain.get("knowledge") || [];
  if (knowledgeItems.length > 0) {
    const lines = knowledgeItems.map(
      (item) =>
        `- [${item.id}] "${item.name}"${item.description ? ` — ${item.description}` : ""} (${item.type}, ~${Math.round(item.contentLength / 1000)}k chars${item.extra ? `, ${item.extra}` : ""})`
    );
    sections.push(
      `=== KNOWLEDGE BASE (${knowledgeItems.length} items) ===\n${lines.join("\n")}`
    );
  }

  // Foundation section — group by type for readability
  const foundationItems = byDomain.get("foundation") || [];
  if (foundationItems.length > 0) {
    const byType = new Map<string, CatalogItem[]>();
    for (const item of foundationItems) {
      const list = byType.get(item.type) || [];
      list.push(item);
      byType.set(item.type, list);
    }

    const typeLabels: Record<string, string> = {
      product: "Products",
      agent: "AI Agents",
      perk: "Perks",
      community_benefit: "Community Benefits",
      partner_brand: "Partner Brands",
    };

    const subSections: string[] = [];
    for (const [type, items] of byType) {
      const label = typeLabels[type] || type;
      const lines = items.map(
        (item) =>
          `  - [${item.id}] "${item.name}"${item.description ? ` — ${item.description}` : ""} (${item.extra || ""})`
      );
      subSections.push(`${label} (${items.length}):\n${lines.join("\n")}`);
    }

    sections.push(
      `=== FOUNDATION DATA (${foundationItems.length} items) ===\n${subSections.join("\n\n")}`
    );
  }

  // Meetings section
  const meetingItems = byDomain.get("meetings") || [];
  if (meetingItems.length > 0) {
    const lines = meetingItems.map(
      (item) =>
        `- [${item.id}] "${item.name}"${item.description ? ` — ${item.description}` : ""} (${item.extra || ""})`
    );
    sections.push(
      `=== MEETINGS (${meetingItems.length}) ===\n${lines.join("\n")}`
    );
  }

  // Operations section (messages, etc.)
  const operationsItems = byDomain.get("operations") || [];
  if (operationsItems.length > 0) {
    const lines = operationsItems.map(
      (item) =>
        `- [${item.id}] "${item.name}"${item.description ? ` — ${item.description}` : ""} (${item.extra || ""})`
    );
    sections.push(
      `=== OPERATIONS (${operationsItems.length}) ===\n${lines.join("\n")}`
    );
  }

  return sections.join("\n\n");
}

// ─── Search / Retrieve ──────────────────────────────────────────────

export async function searchData(
  params: SearchParams
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Phase 1: Fetch by specific IDs
  if (params.item_ids && params.item_ids.length > 0) {
    // Group IDs by type
    const grouped: Record<string, string[]> = {};
    for (const itemId of params.item_ids) {
      const colonIdx = itemId.indexOf(":");
      if (colonIdx === -1) continue;
      const type = itemId.slice(0, colonIdx);
      const id = itemId.slice(colonIdx + 1);
      if (!type || !id) continue;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(id);
    }

    // Route to the correct providers
    const providerGroups = new Map<DataProvider, Record<string, string[]>>();
    for (const [type, ids] of Object.entries(grouped)) {
      const provider = typeToProvider.get(type);
      if (!provider) continue;
      const existing = providerGroups.get(provider) || {};
      existing[type] = ids;
      providerGroups.set(provider, existing);
    }

    const fetchers = Array.from(providerGroups.entries()).map(
      ([provider, group]) =>
        provider.fetchByIds(group).then((r) => results.push(...r))
    );
    await Promise.all(fetchers);
  }

  // Phase 2: Keyword search
  if (params.keyword) {
    const keyword = params.keyword;
    const types = params.types || [];
    const take = 5;

    const searches = providers.map((provider) =>
      provider
        .searchByKeyword(keyword, types, take)
        .then((r) => results.push(...r))
    );
    await Promise.all(searches);
  }

  return results;
}

// ─── Artifact Metadata ──────────────────────────────────────────────

export async function getArtifactMetaForSources(
  sources: Array<{ type: string; id: string; name: string }>
): Promise<ArtifactMeta[]> {
  // Group source IDs by type
  const byType = new Map<string, string[]>();
  for (const source of sources) {
    const colonIdx = source.id.indexOf(":");
    const rawId = colonIdx !== -1 ? source.id.slice(colonIdx + 1) : source.id;
    const list = byType.get(source.type) || [];
    list.push(rawId);
    byType.set(source.type, list);
  }

  // Route to correct providers and fetch metadata
  const fetchers: Promise<ArtifactMeta[]>[] = [];
  for (const [type, ids] of byType) {
    const provider = typeToProvider.get(type);
    if (!provider) continue;
    fetchers.push(provider.getArtifactMeta(ids));
  }

  const results = await Promise.all(fetchers);
  return results.flat();
}

// ─── Tool Definition (for Anthropic API) ────────────────────────────

export const SEARCH_DATA_TOOL = {
  name: "search_data",
  description:
    "Retrieve the full content of specific items by their IDs (from the catalog), or search across all knowledge and foundation data by keyword. Use item_ids when you know which items to retrieve. Use keyword for broader searches.",
  input_schema: {
    type: "object" as const,
    properties: {
      item_ids: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          'Specific item IDs to retrieve from the catalog (e.g. "document:abc-123", "product:def-456", "agent:ghi-789")',
      },
      keyword: {
        type: "string" as const,
        description:
          "Keyword to search across all knowledge and foundation data",
      },
      types: {
        type: "array" as const,
        items: {
          type: "string" as const,
          enum: [
            "document",
            "image",
            "video",
            "audio",
            "link",
            "table",
            "form",
            "rss",
            "app_data",
            "product",
            "agent",
            "perk",
            "community_benefit",
            "partner_brand",
            "meeting",
            "event",
            "message_thread",
            "message",
          ],
        },
        description: "Filter search by data type (only applies to keyword search)",
      },
    },
  },
};
