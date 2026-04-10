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
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  SOURCE_LABELS,
  type TaskStatus,
  type TaskPriority,
} from "./types";

export interface TaskFilters {
  status: string[];
  priority: string[];
  source: string | null;
  search: string;
}

interface TaskFilterBarProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  sources: string[];
}

export function TaskFilterBar({
  filters,
  onFiltersChange,
  sources,
}: TaskFilterBarProps) {
  const toggleStatus = (status: string) => {
    const next = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: next });
  };

  const togglePriority = (priority: string) => {
    const next = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];
    onFiltersChange({ ...filters, priority: next });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="w-48 h-8 text-xs pl-8"
        />
      </div>

      {/* Status filter buttons */}
      <div className="flex items-center rounded-lg bg-muted p-[3px]">
        {(Object.entries(TASK_STATUS_CONFIG) as [TaskStatus, { label: string; className: string }][]).map(
          ([value, config]) => (
            <button
              key={value}
              onClick={() => toggleStatus(value)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                filters.status.includes(value)
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {config.label}
            </button>
          )
        )}
      </div>

      {/* Priority filter buttons */}
      <div className="flex items-center rounded-lg bg-muted p-[3px]">
        {(
          Object.entries(TASK_PRIORITY_CONFIG) as [
            TaskPriority,
            { label: string; className: string; dotColor: string },
          ][]
        )
          .filter(([value]) => value !== "NONE")
          .map(([value, config]) => (
            <button
              key={value}
              onClick={() => togglePriority(value)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors flex items-center gap-1 ${
                filters.priority.includes(value)
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`}
              />
              {config.label}
            </button>
          ))}
      </div>

      {/* Source dropdown */}
      {sources.length > 0 && (
        <Select
          value={filters.source ?? "__all__"}
          onValueChange={(val) =>
            onFiltersChange({
              ...filters,
              source: val === "__all__" ? null : val,
            })
          }
        >
          <SelectTrigger size="sm" className="h-8 text-xs w-32">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Sources</SelectItem>
            {sources.map((src) => (
              <SelectItem key={src} value={src}>
                {SOURCE_LABELS[src] || src}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
