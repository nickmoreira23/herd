"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Bot } from "lucide-react";

interface AgentOption {
  id: string;
  name: string;
  key: string;
}

interface AgentPickerProps {
  value: string | null;
  onChange: (agentId: string | null) => void;
}

export function AgentPicker({ value, onChange }: AgentPickerProps) {
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/agents?limit=500")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        // /api/agents may return either a bare array or an envelope
        const raw = Array.isArray(json.data)
          ? json.data
          : (json.data?.agents ?? []);
        setAgents(
          (raw as AgentOption[]).map((a) => ({
            id: a.id,
            name: a.name,
            key: a.key,
          }))
        );
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = agents.find((a) => a.id === value);
  const filtered = search
    ? agents.filter((a) =>
        (a.name + " " + a.key).toLowerCase().includes(search.toLowerCase())
      )
    : agents;

  if (selected && !open) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
        <Bot className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="flex-1 truncate">{selected.name}</span>
        <span className="text-xs text-muted-foreground">{selected.key}</span>
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
    return (
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
        <span className="flex-1 truncate text-muted-foreground">
          {value.slice(0, 8)}… (não encontrado)
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          alterar
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
          agents.length === 0 ? "Nenhum agente disponível" : "Buscar agente…"
        }
        disabled={agents.length === 0}
      />
      {(search || open) && filtered.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-md border bg-popover">
          {filtered.slice(0, 20).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                onChange(a.id);
                setOpen(false);
                setSearch("");
              }}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{a.name}</span>
                <span className="text-xs text-muted-foreground">{a.key}</span>
              </div>
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
