import type { Tool } from "../manifest";

export const handbookTool: Tool = {
  kind: "tool",
  name: "handbook",
  displayName: "Handbook",
  description:
    "Documentation system reader. Renders bilingual entries from docs/handbook/ with cross-references, glossary, and Mermaid diagrams. Meta-feature — does not consume product blocks.",
  icon: "BookOpen",
  color: "#f59e0b",
  status: "active",
  hasSubRoutes: true,
  area: "infrastructure",
  blocks: [],
  actions: [],
  paths: {
    page: "src/app/admin/handbook",
    components: "src/components/handbook",
  },
};
