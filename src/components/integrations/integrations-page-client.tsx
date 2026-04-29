"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { CATEGORY_META } from "@/lib/integrations/category-meta";
import { Search, X, LayoutGrid, List } from "lucide-react";
import type { Integration } from "@/types";

interface IntegrationsPageClientProps {
  initialIntegrations: Integration[];
  stats: { label: string; value: string }[];
  title?: string;
  description?: string;
  /** When true, show the "By category | Flat list" toggle. Defaults to false. */
  showCategoryToggle?: boolean;
}

export function IntegrationsPageClient({
  initialIntegrations,
  stats,
  title = "All Integrations",
  description = "Connect third-party services to extend your platform.",
  showCategoryToggle = false,
}: IntegrationsPageClientProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"category" | "flat">(
    showCategoryToggle ? "category" : "flat"
  );

  const filtered = useMemo(
    () =>
      initialIntegrations.filter((i) => {
        if (!search) return true;
        return (
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          (i.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
        );
      }),
    [initialIntegrations, search]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Integration[]>();
    for (const integ of filtered) {
      const arr = map.get(integ.category) ?? [];
      arr.push(integ);
      map.set(integ.category, arr);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search + view toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {showCategoryToggle && (
          <div className="inline-flex rounded-md border bg-background p-0.5">
            <button
              type="button"
              onClick={() => setView("category")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded ${
                view === "category"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> By category
            </button>
            <button
              type="button"
              onClick={() => setView("flat")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded ${
                view === "flat"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" /> Flat list
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No integrations found.</p>
        </div>
      ) : view === "flat" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([categoryKey, items]) => {
            const meta = CATEGORY_META[categoryKey as keyof typeof CATEGORY_META];
            const slug = meta?.slug ?? categoryKey.toLowerCase();
            const label = meta?.title ?? categoryKey;
            const connectedCount = items.filter(
              (i) => i.status === "CONNECTED"
            ).length;
            return (
              <section key={categoryKey} className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{label}</h2>
                    <p className="text-xs text-muted-foreground">
                      {items.length} integration{items.length === 1 ? "" : "s"}
                      {" · "}
                      {connectedCount} connected
                    </p>
                  </div>
                  <Link
                    href={`/admin/integrations/${slug}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View all →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
