import { toolCategoryRegistry } from "@/lib/tools/registry";
import { ToolComingSoon } from "@/components/tools/tool-coming-soon";

export default function ContractsPage() {
  const manifest = toolCategoryRegistry.get("legal");
  const toolDef = manifest?.tools.find((t) => t.name === "contracts");
  if (!toolDef) return null;

  return <ToolComingSoon tool={toolDef} />;
}
