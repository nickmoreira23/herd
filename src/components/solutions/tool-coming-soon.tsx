import type { SolutionTool } from "@/lib/solutions/manifest";
import { TOOL_ICON_MAP } from "@/lib/solutions/solution-meta";
import { Wrench } from "lucide-react";

interface ToolComingSoonProps {
  tool: SolutionTool;
}

export function ToolComingSoon({ tool }: ToolComingSoonProps) {
  const Icon = TOOL_ICON_MAP[tool.icon] || Wrench;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{tool.displayName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tool.description}
        </p>
      </div>

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
