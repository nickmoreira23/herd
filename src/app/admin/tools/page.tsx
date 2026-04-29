import Link from "next/link";
import { getAllToolCategories } from "@/lib/tools/registry";
import { CATEGORY_ICON_MAP, DEFAULT_CATEGORY_ICON } from "@/lib/tools/category-meta";
import { connection } from "next/server";

export default async function AllToolsPage() {
  await connection();
  const categories = getAllToolCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Tools</h1>
        <p className="text-muted-foreground mt-1">
          Tools across {categories.length} business areas.
        </p>
      </div>

      {categories.map((category) => {
        const CategoryIcon =
          CATEGORY_ICON_MAP[category.icon] || DEFAULT_CATEGORY_ICON;

        return (
          <div key={category.name}>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: category.color }}
            >
              {category.displayName}
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.tools.map((tool) => {
                const isActive = tool.status !== "coming-soon";
                const href = `/admin/tools/${category.name}/${tool.name}`;

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
                        style={{ backgroundColor: `${category.color}15` }}
                      >
                        <CategoryIcon
                          className="h-4 w-4"
                          style={{ color: category.color }}
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
