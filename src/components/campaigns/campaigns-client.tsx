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
import { CampaignCard } from "./campaign-card";
import { CampaignsKanban } from "./campaigns-kanban";
import { CreateCampaignDialog } from "./create-campaign-dialog";
import {
  CHANNEL_CONFIG,
  CHANNEL_ORDER,
  STATUS_CONFIG,
  STATUS_ORDER,
  type CampaignRow,
} from "./types";
import { Megaphone, Columns3, LayoutGrid } from "lucide-react";

interface CampaignsClientProps {
  initialCampaigns: CampaignRow[];
}

export function CampaignsClient({ initialCampaigns }: CampaignsClientProps) {
  const [campaigns] = useState(initialCampaigns);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [view, setView] = useState<"kanban" | "grid">("kanban");

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (channelFilter !== "all" && !c.channels.includes(channelFilter as never))
        return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.description?.toLowerCase().includes(q) ?? false) ||
          (c.audience?.toLowerCase().includes(q) ?? false) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [campaigns, search, statusFilter, channelFilter]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Campanhas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Iniciativas de marketing rodando em diferentes canais.
          </p>
        </div>
        <CreateCampaignDialog />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Buscar nome, audiência…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os canais</SelectItem>
            {CHANNEL_ORDER.map((ch) => (
              <SelectItem key={ch} value={ch}>
                {CHANNEL_CONFIG[ch].emoji} {CHANNEL_CONFIG[ch].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1 rounded-md border p-0.5">
          <button
            type="button"
            onClick={() => setView("kanban")}
            aria-label="Visualização kanban"
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
            aria-label="Visualização grid"
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
          <Megaphone className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">Nenhuma campanha encontrada</h3>
          <p className="text-xs text-muted-foreground">
            Crie a primeira em "Nova campanha".
          </p>
        </div>
      ) : view === "kanban" ? (
        <CampaignsKanban campaigns={filtered} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
}
