import { solutionRegistry } from "@/lib/solutions/registry";
import { ToolComingSoon } from "@/components/solutions/tool-coming-soon";

export default function ContractsPage() {
  const manifest = solutionRegistry.get("legal");
  const toolDef = manifest?.tools.find((t) => t.name === "contracts");
  if (!toolDef) return null;

  return <ToolComingSoon tool={toolDef} />;
}
