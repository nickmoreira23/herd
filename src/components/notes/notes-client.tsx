"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NoteCard } from "./note-card";
import { CreateNoteDialog } from "./create-note-dialog";
import type { NoteRow } from "./types";
import { StickyNote } from "lucide-react";

interface NotesClientProps {
  initialNotes: NoteRow[];
}

type Filter = "active" | "pinned" | "archived";

export function NotesClient({ initialNotes }: NotesClientProps) {
  const [notes] = useState(initialNotes);
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (filter === "active" && n.archived) return false;
      if (filter === "pinned" && !n.pinned) return false;
      if (filter === "archived" && !n.archived) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.contentText.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [notes, filter, search]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Anotações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Notas livres com texto formatado, opcionalmente vinculadas a outras
            entidades.
          </p>
        </div>
        <CreateNoteDialog />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Buscar por título, conteúdo ou tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-1">
          {(["active", "pinned", "archived"] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "active" ? "Ativas" : f === "pinned" ? "Fixadas" : "Arquivadas"}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center gap-2 py-16 border border-dashed rounded-lg">
          <StickyNote className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">Nenhuma anotação encontrada</h3>
          <p className="text-xs text-muted-foreground">
            Crie sua primeira anotação clicando em "Nova nota".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </div>
  );
}
