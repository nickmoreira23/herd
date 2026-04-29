"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function CreateNoteDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { title: title.trim() };
      if (entityType.trim() && entityId.trim()) {
        body.entityType = entityType.trim();
        body.entityId = entityId.trim();
      }
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error(json);
        return;
      }
      setOpen(false);
      setTitle("");
      setEntityType("");
      setEntityId("");
      router.push(`/admin/blocks/notes/${json.data.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nova nota
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar nova anotação</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="note-title">Título</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Briefing reunião com cliente"
              autoFocus
            />
          </div>
          <details>
            <summary className="text-xs text-muted-foreground cursor-pointer">
              Anexar a uma entidade (opcional)
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="note-entity-type">Tipo</Label>
                <Input
                  id="note-entity-type"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  placeholder="contact / deal / task"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note-entity-id">ID</Label>
                <Input
                  id="note-entity-id"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  placeholder="UUID"
                />
              </div>
            </div>
          </details>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || submitting}
          >
            Criar
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
