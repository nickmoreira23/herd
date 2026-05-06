import type { Tool } from "@/lib/tools/manifest";
import { TOOL_ICON_MAP } from "@/lib/tools/category-meta";
import { Wrench } from "lucide-react";
import { PageHeader, type Crumb } from "@/components/layout/page-header";
import { toolToCategory } from "@/lib/tools/registry";

interface ToolComingSoonProps {
  tool: Tool;
}

export function ToolComingSoon({ tool }: ToolComingSoonProps) {
  const Icon = TOOL_ICON_MAP[tool.icon] || Wrench;
  const parent = toolToCategory.get(tool.name);
  const crumbs: Crumb[] = [{ label: "Tools", href: "/admin/tools" }];
  if (parent) {
    crumbs.push({
      label: parent.category.displayName,
      href: `/admin/tools/${parent.category.name}`,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={crumbs}
        title={tool.displayName}
        description={tool.description}
      />

      <div className="rounded-xl border bg-card">
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="rounded-lg bg-muted/50 p-3 mb-4">
            <Icon className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-semibold text-base">Coming soon</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {tool.description}
          </p>
        </div>
      </div>
    </div>
  );
}
