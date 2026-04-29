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
import { Sparkles, Columns3, LayoutGrid } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { ExperienceCard } from "./experience-card";
import { ExperiencesKanban } from "./experiences-kanban";
import { CreateExperienceDialog } from "./create-experience-dialog";
import {
  FORMAT_ORDER,
  STATUS_ORDER,
  type ExperienceRow,
} from "./types";

interface ExperiencesClientProps {
  initialExperiences: ExperienceRow[];
}

export function ExperiencesClient({
  initialExperiences,
}: ExperiencesClientProps) {
  const t = useT();
  const [experiences] = useState(initialExperiences);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [view, setView] = useState<"kanban" | "grid">("kanban");

  const filtered = useMemo(() => {
    return experiences.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (formatFilter !== "all" && e.format !== formatFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          (e.headline?.toLowerCase().includes(q) ?? false) ||
          (e.description?.toLowerCase().includes(q) ?? false) ||
          (e.locationName?.toLowerCase().includes(q) ?? false) ||
          e.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [experiences, search, statusFilter, formatFilter]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("experiences.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("experiences.subtitle")}
          </p>
        </div>
        <CreateExperienceDialog />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder={t("experiences.search.placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("experiences.filter.allStatus")}</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`experiences.status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("experiences.filter.allFormats")}</SelectItem>
            {FORMAT_ORDER.map((f) => (
              <SelectItem key={f} value={f}>
                {t(`experiences.format.${f}`)}
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
          <Sparkles className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">{t("experiences.empty.title")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("experiences.empty.body")}
          </p>
        </div>
      ) : view === "kanban" ? (
        <ExperiencesKanban experiences={filtered} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((e) => (
            <ExperienceCard key={e.id} experience={e} />
          ))}
        </div>
      )}
    </div>
  );
}
