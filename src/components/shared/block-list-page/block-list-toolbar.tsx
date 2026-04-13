"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ViewModeToggle } from "./view-mode-toggle";
import type { FilterDef } from "./types";

interface BlockListToolbarProps {
  // View toggle
  views: string[];
  activeView: string;
  onViewChange: (view: string) => void;
  // Filters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters?: FilterDef<any>[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  // Extras (rendered between filters and search)
  extras?: React.ReactNode;
  // Search
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  // Counts
  resultCount: number;
  totalCount: number;
}

export function BlockListToolbar({
  views,
  activeView,
  onViewChange,
  filters,
  filterValues,
  onFilterChange,
  extras,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  resultCount,
  totalCount,
}: BlockListToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-4 pb-4">
      {/* View toggle */}
      <ViewModeToggle
        views={views}
        active={activeView}
        onChange={onViewChange}
      />

      {/* Filters */}
      {filters?.map((filter) => (
        <Select
          key={filter.key}
          value={filterValues[filter.key] ?? "all"}
          onValueChange={(val) => onFilterChange(filter.key, val)}
        >
          <SelectTrigger className="h-9 w-auto min-w-[8rem] text-sm">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{filter.label}</SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {/* Extras */}
      {extras}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-64 pl-9 text-sm"
          />
        </div>
      )}

      {/* Result count (only when filtering) */}
      {search && resultCount !== totalCount && (
        <span className="text-xs text-muted-foreground shrink-0">
          {resultCount} of {totalCount}
        </span>
      )}
    </div>
  );
}
