import Link from "next/link";
import { connection } from "next/server";
import { getAllAreas } from "@/lib/core/registry";
import { allTools } from "@/lib/tools/registry";
import type { Tool } from "@/lib/tools/manifest";
import {
  MessageSquare,
  ShoppingBag,
  Briefcase,
  Bell,
  UserCircle,
  Server,
  LayoutDashboard,
  Receipt,
  BookOpen,
  Brain,
  Network as NetworkIcon,
  Lightbulb,
  Boxes,
  TrendingUp,
  CreditCard,
  Wallet,
  FileText,
  FileSignature,
  Flag,
  GitBranch,
  Target,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

// Resolve icon name (string in manifest) → Lucide component.
const ICON_MAP: Record<string, LucideIcon> = {
  // Areas
  MessageSquare,
  ShoppingBag,
  Briefcase,
  Bell,
  UserCircle,
  Server,
  // Tools
  LayoutDashboard,
  Receipt,
  BookOpen,
  Brain,
  Network: NetworkIcon,
  Lightbulb,
  Boxes,
  TrendingUp,
  CreditCard,
  Wallet,
  FileText,
  FileSignature,
  Flag,
  GitBranch,
  Target,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? HelpCircle;
}

// Resolve admin URL from manifest paths.page (manifest é source of truth).
function getToolHref(tool: Tool): string {
  if (tool.name === "dashboard") return "/admin";
  return tool.paths.page.replace(/^src\/app/, "");
}

export default async function AreasLandingPage() {
  await connection();
  const areas = getAllAreas();
  const tools = Object.values(allTools);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Areas</h1>
        <p className="text-muted-foreground mt-1">
          Macro-divisões estruturais do produto. Cada area agrupa tools por função
          no produto.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => {
          const areaTools = tools.filter((t) => t.area === area.name);
          const AreaIcon = resolveIcon(area.icon);

          return (
            <div
              key={area.name}
              className="rounded-lg border p-5 transition-colors hover:border-foreground/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${area.color}15` }}
                >
                  <AreaIcon className="h-5 w-5" style={{ color: area.color }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{area.displayName}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {areaTools.length} tool{areaTools.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {area.description}
              </p>

              {areaTools.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Em breve.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {areaTools.map((tool) => {
                    const ToolIcon = resolveIcon(tool.icon);
                    return (
                      <li key={tool.name}>
                        <Link
                          href={getToolHref(tool)}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                        >
                          <ToolIcon
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: tool.color }}
                          />
                          <span>{tool.displayName}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
