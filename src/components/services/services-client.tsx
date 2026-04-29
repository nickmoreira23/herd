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
import { ServiceCard } from "./service-card";
import { ServiceRow as ServiceTableRow } from "./service-row";
import { CreateServiceDialog } from "./create-service-dialog";
import {
  PRICING_TYPE_CONFIG,
  STATUS_CONFIG,
  type ServiceRow as ServiceRowType,
} from "./types";
import { Briefcase, LayoutGrid, List } from "lucide-react";

interface ServicesClientProps {
  initialServices: ServiceRowType[];
}

export function ServicesClient({ initialServices }: ServicesClientProps) {
  const [services] = useState(initialServices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pricingFilter, setPricingFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (pricingFilter !== "all" && s.pricingType !== pricingFilter)
        return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          (s.description?.toLowerCase().includes(q) ?? false) ||
          s.contentText.toLowerCase().includes(q) ||
          (s.category?.toLowerCase().includes(q) ?? false) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [services, search, statusFilter, pricingFilter]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catálogo de serviços ofertados pela empresa.
          </p>
        </div>
        <CreateServiceDialog />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Buscar por nome, categoria, descrição…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
              <SelectItem key={k} value={k}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={pricingFilter} onValueChange={setPricingFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos de cobrança</SelectItem>
            {Object.entries(PRICING_TYPE_CONFIG).map(([k, cfg]) => (
              <SelectItem key={k} value={k}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1 rounded-md border p-0.5">
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
          <Briefcase className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">Nenhum serviço encontrado</h3>
          <p className="text-xs text-muted-foreground">
            Crie o primeiro em "Novo serviço".
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TR>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
              </TR>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <ServiceTableRow key={s.id} service={s} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
