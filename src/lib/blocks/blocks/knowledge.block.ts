import type { BlockManifest } from "../manifest";

/**
 * Knowledge is a **meta-feature** — it composes first-class blocks
 * (documents, images, videos, audios, tables, forms, links, feeds, apps)
 * into a unified knowledge base view. It owns no content types directly;
 * individual blocks own their data. Knowledge provides:
 *   - A dashboard aggregating all composed blocks
 *   - Folder organization (KnowledgeFolder model)
 *   - A settings API to toggle which blocks participate
 *   - Origin tracking via `sourceFeature: "knowledge"` on composed items
 */
export const knowledgeBlock: BlockManifest = {
  name: "knowledge",
  displayName: "Knowledge Base",
  description:
    "Meta-feature that composes first-class blocks (documents, images, videos, audios, tables, forms, links, feeds, apps) into a unified knowledge base. Provides folder organization, block composition settings, and origin tracking. Individual blocks own their data and API routes.",
  domain: "meta",
  types: [], // owns no types — delegates to composed blocks
  capabilities: ["compose"],
  models: ["KnowledgeFolder"],
  dependencies: [
    "documents",
    "images",
    "videos",
    "audios",
    "tables",
    "forms",
    "links",
    "feeds",
    "apps",
  ],
  paths: {
    components: "src/components/knowledge/",
    pages: "src/app/admin/organization/knowledge/",
    api: "src/app/api/knowledge/",
    lib: "src/lib/knowledge-commons/",
  },
  actions: [], // delegates all actions to composed blocks
};
