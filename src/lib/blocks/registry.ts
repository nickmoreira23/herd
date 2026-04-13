import type { BlockAction, BlockManifest } from "./manifest";
import { eventsBlock } from "./blocks/events.block";
import { productsBlock } from "./blocks/products.block";
import { meetingsBlock } from "./blocks/meetings.block";
import { knowledgeBlock } from "./blocks/knowledge.block";
import { agentsBlock } from "./blocks/agents.block";
import { communityBlock } from "./blocks/community.block";
import { perksBlock } from "./blocks/perks.block";
import { partnersBlock } from "./blocks/partners.block";
import { subscriptionsBlock } from "./blocks/subscriptions.block";
import { pagesBlock } from "./blocks/pages.block";
// Knowledge-type blocks (first-class)
import { documentsBlock } from "./blocks/documents.block";
import { imagesBlock } from "./blocks/images.block";
import { videosBlock } from "./blocks/videos.block";
import { audiosBlock } from "./blocks/audios.block";
import { tablesBlock } from "./blocks/tables.block";
import { formsBlock } from "./blocks/forms.block";
import { linksBlock } from "./blocks/links.block";
import { feedsBlock } from "./blocks/feeds.block";
import { appsBlock } from "./blocks/apps.block";
// Foundation blocks
import { voiceBlock } from "./blocks/voice.block";
// Operations blocks
import { messagesBlock } from "./blocks/messages.block";

// ─── All registered blocks ────────────────────────────────────────
// To add a new block, create a manifest and add it here.

const blocks: BlockManifest[] = [
  eventsBlock,
  productsBlock,
  meetingsBlock,
  knowledgeBlock,
  agentsBlock,
  communityBlock,
  perksBlock,
  partnersBlock,
  subscriptionsBlock,
  pagesBlock,
  // Knowledge-type blocks (first-class)
  documentsBlock,
  imagesBlock,
  videosBlock,
  audiosBlock,
  tablesBlock,
  formsBlock,
  linksBlock,
  feedsBlock,
  appsBlock,
  // Foundation blocks
  voiceBlock,
  // Operations blocks
  messagesBlock,
];

// ─── Lookup Maps ──────────────────────────────────────────────────

/** Name → manifest */
export const blockRegistry = new Map<string, BlockManifest>(
  blocks.map((b) => [b.name, b])
);

/** Data type → manifest (e.g. "product" → productsBlock) */
export const typeToBlock = new Map<string, BlockManifest>();
for (const block of blocks) {
  for (const type of block.types) {
    typeToBlock.set(type, block);
  }
}

/** Action name → { block, action } */
export const actionToBlock = new Map<
  string,
  { block: BlockManifest; action: BlockAction }
>();
for (const block of blocks) {
  for (const action of block.actions) {
    actionToBlock.set(action.name, { block, action });
  }
}

// ─── Public Helpers ───────────────────────────────────────────────

export function getAllBlocks(): BlockManifest[] {
  return blocks;
}

/**
 * Builds a text catalog of all block actions for the LLM system prompt.
 * Grouped by block with action descriptions and required fields.
 */
export function buildActionCatalog(): string {
  const sections = blocks
    .filter((b) => b.actions.length > 0)
    .map((block) => {
      const actionLines = block.actions.map((a) => {
        const required = a.requiredFields?.length
          ? ` (required: ${a.requiredFields.join(", ")})`
          : "";
        return `  - ${a.name}: ${a.description}${required}`;
      });
      return `${block.displayName} [${block.name}]:\n${actionLines.join("\n")}`;
    });
  return sections.join("\n\n");
}
