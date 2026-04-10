"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ChevronRight } from "lucide-react";
import { DynamicIcon } from "@/components/shared/icon-picker";
import { PERK_PRESETS, PERK_CATEGORIES } from "./perk-presets";
import { PerkDetailClient, type PerkFormState } from "./perk-detail-client";
import Link from "next/link";

interface PerkCreateWizardProps {
  allTiers: { id: string; name: string }[];
}

export function PerkCreateWizard({ allTiers }: PerkCreateWizardProps) {
  const [step, setStep] = useState<"choose" | "form">("choose");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [prefilledForm, setPrefilledForm] = useState<Partial<PerkFormState> | null>(null);

  const filteredPresets = useMemo(() => {
    let results = PERK_PRESETS;
    if (selectedCategory) {
      results = results.filter((p) => p.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return results;
  }, [search, selectedCategory]);

  if (step === "form") {
    return <PerkDetailClient allTiers={allTiers} prefill={prefilledForm ?? undefined} />;
  }

  return (
    <div className="flex flex-col -m-6 min-h-[100vh]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b py-3 px-4">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/perks"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Perks
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium">New Perk</span>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">What kind of perk would you like to add?</h1>
            <p className="text-sm text-muted-foreground">
              Choose a template to get started quickly, or create a completely custom perk.
            </p>
          </div>

          {/* Search + Custom */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search perks..."
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setPrefilledForm(null);
                setStep("form");
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Custom
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {PERK_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Presets Grid */}
          {filteredPresets.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No matching perks found. Try a different search or{" "}
              <button
                onClick={() => {
                  setPrefilledForm(null);
                  setStep("form");
                }}
                className="text-brand underline"
              >
                create a custom perk
              </button>
              .
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setPrefilledForm(preset.defaults);
                    setStep("form");
                  }}
                  className="group rounded-lg border bg-card p-4 text-left hover:border-foreground/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-brand/10 transition-colors">
                      <DynamicIcon
                        name={preset.icon}
                        className="h-4.5 w-4.5 text-muted-foreground group-hover:text-brand transition-colors"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{preset.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {preset.description}
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-2 text-[10px] font-normal"
                      >
                        {preset.category}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
