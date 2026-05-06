import type { ToolCategoryManifest } from "@/lib/tools/manifest";
import { TOOL_ICON_MAP } from "@/lib/tools/category-meta";
import { ToolCard } from "./tool-card";
import { ComingSoonCard } from "./coming-soon-card";
import { Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

interface CategoryLandingProps {
  manifest: ToolCategoryManifest;
}

export function CategoryLanding({ manifest }: CategoryLandingProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Tools", href: "/admin/tools" }]}
        title={manifest.displayName}
        description={manifest.description}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {manifest.tools.map((tool) => {
          const Icon = TOOL_ICON_MAP[tool.icon] || Wrench;

          if (tool.status === "coming-soon") {
            return (
              <ComingSoonCard
                key={tool.name}
                icon={Icon}
                title={tool.displayName}
                description={tool.description}
              />
            );
          }

          return (
            <ToolCard
              key={tool.name}
              href={`/admin/tools/${tool.name}`}
              icon={Icon}
              iconColor={tool.color}
              title={tool.displayName}
              description={tool.description}
            />
          );
        })}
      </div>
    </div>
  );
}
