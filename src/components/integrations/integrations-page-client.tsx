"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { Search, X } from "lucide-react";
import type { Integration } from "@/types";

interface IntegrationsPageClientProps {
  initialIntegrations: Integration[];
  stats: { label: string; value: string }[];
  title?: string;
  description?: string;
}

export function IntegrationsPageClient({
  initialIntegrations,
  stats,
  title = "All Integrations",
  description = "Connect third-party services to extend your platform.",
}: IntegrationsPageClientProps) {
  const [search, setSearch] = useState("");

  const filtered = initialIntegrations.filter((i) => {
    if (!search) return true;
    return (
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  });

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

      {/* Search */}
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

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No integrations found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      )}
    </div>
  );
}
