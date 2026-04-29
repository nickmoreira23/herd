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
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow as TR,
} from "@/components/ui/table";
import { DealCard } from "./deal-card";
import { DealRow } from "./deal-row";
import { DealsKanban } from "./deals-kanban";
import { CreateDealDialog } from "./create-deal-dialog";
import {
  STAGE_CONFIG,
  STAGE_ORDER,
  contactDisplayName,
  type DealRow as DealRowType,
} from "./types";
import { Columns3, Handshake, LayoutGrid, List } from "lucide-react";

interface DealsClientProps {
  initialDeals: DealRowType[];
}

export function DealsClient({ initialDeals }: DealsClientProps) {
  const [deals] = useState(initialDeals);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list" | "kanban">("kanban");

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (stageFilter !== "all" && d.stage !== stageFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          (d.description?.toLowerCase().includes(q) ?? false) ||
          (d.company?.name.toLowerCase().includes(q) ?? false) ||
          (contactDisplayName(d.contact)?.toLowerCase().includes(q) ?? false) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [deals, search, stageFilter]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Oportunidades</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pipeline comercial — leads, propostas e negócios em andamento.
          </p>
        </div>
        <CreateDealDialog />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Buscar título, empresa, contato…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estágios</SelectItem>
            {STAGE_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STAGE_CONFIG[s].label}
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
            onClick={() => setView("list")}
            aria-label="Visualização lista"
            className={`rounded px-2 py-1.5 transition-colors ${
              view === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-4 w-4" />
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
          <Handshake className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">Nenhuma oportunidade encontrada</h3>
          <p className="text-xs text-muted-foreground">
            Crie a primeira em "Nova oportunidade".
          </p>
        </div>
      ) : view === "kanban" ? (
        <DealsKanban deals={filtered} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TR>
                <TableHead>Título</TableHead>
                <TableHead>Estágio</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Prob.</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead>Tags</TableHead>
              </TR>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <DealRow key={d.id} deal={d} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
