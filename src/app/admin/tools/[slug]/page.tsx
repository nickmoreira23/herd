import { notFound } from "next/navigation";
import { toolCategoryRegistry, allTools } from "@/lib/tools/registry";
import { CategoryLanding } from "@/components/tools/category-landing";
import { ToolComingSoon } from "@/components/tools/tool-coming-soon";

export default async function ToolsDynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Try category first (e.g. /admin/tools/finances)
  const category = toolCategoryRegistry.get(slug);
  if (category && category.tools.length > 0) {
    return <CategoryLanding manifest={category} />;
  }

  // Fall back to tool (coming-soon tools without dedicated routes)
  const tool = allTools[slug];
  if (tool) {
    return <ToolComingSoon tool={tool} />;
  }

  notFound();
}
