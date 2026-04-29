"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Workflow, Columns3, LayoutGrid, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";
import { RoutineCard } from "./routine-card";
import { RoutinesKanban } from "./routines-kanban";
import {
  STATUS_ORDER,
  TRIGGER_ORDER,
  type RoutineRow,
} from "./types";

interface RoutinesClientProps {
  initialRoutines: RoutineRow[];
}

export function RoutinesClient({ initialRoutines }: RoutinesClientProps) {
  const t = useT();
  const [routines] = useState(initialRoutines);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [triggerFilter, setTriggerFilter] = useState<string>("all");
  const [view, setView] = useState<"kanban" | "grid">("kanban");

  const filtered = useMemo(() => {
    return routines.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (triggerFilter !== "all" && r.triggerType !== triggerFilter)
        return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          (r.description?.toLowerCase().includes(q) ?? false) ||
          r.promptTemplate.toLowerCase().includes(q) ||
          (r.agent?.name?.toLowerCase().includes(q) ?? false) ||
          r.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [routines, search, statusFilter, triggerFilter]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("routines.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("routines.subtitle")}
          </p>
        </div>
        <Link href="/admin/blocks/routines/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t("routines.create")}
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder={t("routines.search.placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("routines.filter.allStatus")}</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`routines.status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={triggerFilter} onValueChange={setTriggerFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("routines.filter.allTriggers")}
            </SelectItem>
            {TRIGGER_ORDER.map((tr) => (
              <SelectItem key={tr} value={tr}>
                {t(`routines.trigger.${tr}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1 rounded-md border p-0.5">
          <button
            type="button"
            onClick={() => setView("kanban")}
            aria-label={t("common.view.kanban")}
            className={`rounded px-2 py-1.5 transition-colors ${
              view === "kanban"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Columns3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label={t("common.view.grid")}
            className={`rounded px-2 py-1.5 transition-colors ${
              view === "grid"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center gap-2 py-16 border border-dashed rounded-lg">
          <Workflow className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">{t("routines.empty.title")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("routines.empty.body")}
          </p>
        </div>
      ) : view === "kanban" ? (
        <RoutinesKanban routines={filtered} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((r) => (
            <RoutineCard key={r.id} routine={r} />
          ))}
        </div>
      )}
    </div>
  );
}
