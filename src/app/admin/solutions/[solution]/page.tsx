import { notFound, redirect } from "next/navigation";
import { solutionRegistry } from "@/lib/solutions/registry";

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ solution: string }>;
}) {
  const { solution: solutionName } = await params;
  const manifest = solutionRegistry.get(solutionName);
  if (!manifest || manifest.tools.length === 0) notFound();

  // Always redirect to the first tool — the sub-panel lists all tools
  redirect(`/admin/solutions/${solutionName}/${manifest.tools[0].name}`);
}
