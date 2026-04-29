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
import { CompanyCard } from "./company-card";
import { CompanyRow as CompanyTableRow } from "./company-row";
import { CreateCompanyDialog } from "./create-company-dialog";
import { SIZE_CONFIG, type CompanyRow as CompanyRowType } from "./types";
import { Building2, LayoutGrid, List } from "lucide-react";

interface CompaniesClientProps {
  initialCompanies: CompanyRowType[];
}

export function CompaniesClient({ initialCompanies }: CompaniesClientProps) {
  const [companies] = useState(initialCompanies);
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (sizeFilter !== "all" && c.size !== sizeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.legalName?.toLowerCase().includes(q) ?? false) ||
          (c.domain?.toLowerCase().includes(q) ?? false) ||
          (c.industry?.toLowerCase().includes(q) ?? false) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [companies, search, sizeFilter]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Empresas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organizações com quem você se relaciona — clientes, prospects, parceiros B2B.
          </p>
        </div>
        <CreateCompanyDialog />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Buscar nome, domínio, setor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={sizeFilter} onValueChange={setSizeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tamanhos</SelectItem>
            {Object.entries(SIZE_CONFIG).map(([k, label]) => (
              <SelectItem key={k} value={k}>
                {label}
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
          <Building2 className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">Nenhuma empresa encontrada</h3>
          <p className="text-xs text-muted-foreground">
            Crie a primeira em "Nova empresa".
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TR>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Domínio</TableHead>
                <TableHead>Contatos</TableHead>
                <TableHead>Tags</TableHead>
              </TR>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <CompanyTableRow key={c.id} company={c} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
