"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, User } from "lucide-react";

interface ContactOption {
  id: string;
  firstName: string;
  lastName: string | null;
}

interface ContactPickerProps {
  value: string | null;
  onChange: (contactId: string | null) => void;
}

function displayName(c: ContactOption): string {
  return [c.firstName, c.lastName].filter(Boolean).join(" ");
}

export function ContactPicker({ value, onChange }: ContactPickerProps) {
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/contacts?limit=500")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = (json.data?.contacts ?? []) as ContactOption[];
        setContacts(
          list.map((c) => ({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
          }))
        );
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = contacts.find((c) => c.id === value);
  const filtered = search
    ? contacts.filter((c) =>
        displayName(c).toLowerCase().includes(search.toLowerCase())
      )
    : contacts;

  if (selected && !open) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="flex-1 truncate">{displayName(selected)}</span>
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
          contacts.length === 0 ? "Nenhum contato cadastrado" : "Buscar contato…"
        }
        disabled={contacts.length === 0}
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
              {displayName(c)}
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
