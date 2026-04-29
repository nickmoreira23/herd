import { notFound } from "next/navigation";
import { toolCategoryRegistry } from "@/lib/tools/registry";
import { CategoryLanding } from "@/components/tools/category-landing";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categoryName } = await params;
  const manifest = toolCategoryRegistry.get(categoryName);
  if (!manifest || manifest.tools.length === 0) notFound();

  return <CategoryLanding manifest={manifest} />;
}
