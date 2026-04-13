import Link from "next/link";
import { getAllSolutions } from "@/lib/solutions/registry";
import { SOLUTION_ICON_MAP, DEFAULT_SOLUTION_ICON } from "@/lib/solutions/solution-meta";
import { connection } from "next/server";

export default async function AllSolutionsPage() {
  await connection();
  const solutions = getAllSolutions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Solutions</h1>
        <p className="text-muted-foreground mt-1">
          {solutions.length} solutions across your platform.
        </p>
      </div>

      {solutions.map((solution) => {
        const SolutionIcon =
          SOLUTION_ICON_MAP[solution.icon] || DEFAULT_SOLUTION_ICON;
        const activeTools = solution.tools.filter(
          (t) => t.status !== "coming-soon"
        );
        const comingSoonTools = solution.tools.filter(
          (t) => t.status === "coming-soon"
        );

        return (
          <div key={solution.name}>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: solution.color }}
            >
              {solution.displayName}
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {solution.tools.map((tool) => {
                const isActive = tool.status !== "coming-soon";
                const firstTool = solution.tools[0];
                const href = `/admin/solutions/${solution.name}/${tool.name}`;

                return (
                  <Link
                    key={tool.name}
                    href={isActive ? href : "#"}
                    className={`rounded-lg border p-5 transition-colors ${
                      isActive
                        ? "hover:border-foreground/20 hover:bg-muted/50"
                        : "opacity-60 cursor-default"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${solution.color}15` }}
                      >
                        <SolutionIcon
                          className="h-4 w-4"
                          style={{ color: solution.color }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">
                          {tool.displayName}
                        </h3>
                        {!isActive && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {tool.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
