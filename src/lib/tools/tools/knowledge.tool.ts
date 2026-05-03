import type { Tool } from "../manifest";

export const knowledgeTool: Tool = {
  kind: "tool",
  name: "knowledge",
  displayName: "Knowledge Base",
  description:
    "Meta-tool that composes first-class blocks (documents, images, videos, audios, tables, forms, links, feeds, apps) into a unified knowledge base. Provides folder organization, block composition settings, and origin tracking.",
  icon: "Brain",
  color: "#a855f7",
  status: "active",
  hasSubRoutes: true,
  area: "identity",
  blocks: [
    {
      blockName: "documents",
      usage: "read-write",
      purpose: "Document content in knowledge base",
    },
    {
      blockName: "images",
      usage: "read-write",
      purpose: "Image content",
    },
    {
      blockName: "videos",
      usage: "read-write",
      purpose: "Video content",
    },
    {
      blockName: "audios",
      usage: "read-write",
      purpose: "Audio content",
    },
    {
      blockName: "tables",
      usage: "read-write",
      purpose: "Tabular data",
    },
    {
      blockName: "forms",
      usage: "read-write",
      purpose: "Form-collected data",
    },
    {
      blockName: "links",
      usage: "read-write",
      purpose: "External link references",
    },
    {
      blockName: "feeds",
      usage: "read-write",
      purpose: "RSS/Atom feed content",
    },
    {
      blockName: "apps",
      usage: "read-write",
      purpose: "External app integrations",
    },
  ],
  actions: [],
  paths: {
    page: "src/app/admin/knowledge",
    components: "src/components/knowledge",
  },
};
