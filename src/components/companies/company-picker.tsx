"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Building2 } from "lucide-react";

interface CompanyOption {
  id: string;
  name: string;
}

interface CompanyPickerProps {
  value: string | null;
  onChange: (companyId: string | null) => void;
}

export function CompanyPicker({ value, onChange }: CompanyPickerProps) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/companies?limit=500")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = (json.data?.companies ?? []) as CompanyOption[];
        setCompanies(list.map((c) => ({ id: c.id, name: c.name })));
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = companies.find((c) => c.id === value);
  const filtered = search
    ? companies.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : companies;

  if (selected && !open) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="flex-1 truncate">{selected.name}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          alterar
        </button>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remover vínculo"
          className="hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (!selected && value && loaded) {
    // Value points to a deleted/missing company — show as raw UUID with option to clear
    return (
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
        <span className="flex-1 truncate text-muted-foreground">
          {value.slice(0, 8)}… (não encontrada)
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          alterar
        </button>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remover vínculo"
          className="hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={
          companies.length === 0 ? "Nenhuma empresa cadastrada" : "Buscar empresa…"
        }
        disabled={companies.length === 0}
      />
      {(search || open) && filtered.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-md border bg-popover">
          {filtered.slice(0, 20).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onChange(c.id);
                setOpen(false);
                setSearch("");
              }}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      {open && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setSearch("");
          }}
        >
          Cancelar
        </Button>
      )}
    </div>
  );
}
