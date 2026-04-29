import { notFound } from "next/navigation";
import { toolCategoryRegistry } from "@/lib/tools/registry";
import { ToolComingSoon } from "@/components/tools/tool-coming-soon";

export default async function SalesToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const manifest = toolCategoryRegistry.get("sales");
  if (!manifest) notFound();

  const toolDef = manifest.tools.find((t) => t.name === tool);
  if (!toolDef) notFound();

  return <ToolComingSoon tool={toolDef} />;
}
