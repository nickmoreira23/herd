import { notFound } from "next/navigation";
import { solutionRegistry } from "@/lib/solutions/registry";
import { ToolComingSoon } from "@/components/solutions/tool-coming-soon";

export default async function SalesToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const manifest = solutionRegistry.get("sales");
  if (!manifest) notFound();

  const toolDef = manifest.tools.find((t) => t.name === tool);
  if (!toolDef) notFound();

  return <ToolComingSoon tool={toolDef} />;
}
