import type { ToolCategoryManifest } from "@/lib/tools/manifest";
import { TOOL_ICON_MAP } from "@/lib/tools/category-meta";
import { ToolCard } from "./tool-card";
import { ComingSoonCard } from "./coming-soon-card";
import { Wrench } from "lucide-react";

interface CategoryLandingProps {
  manifest: ToolCategoryManifest;
}

export function CategoryLanding({ manifest }: CategoryLandingProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{manifest.displayName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {manifest.description}
        </p>
      </div>

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
              href={`/admin/tools/${manifest.name}/${tool.name}`}
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
