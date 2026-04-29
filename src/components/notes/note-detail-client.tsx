"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NoteEditor } from "./note-editor";
import { ArrowLeft, Trash2, X } from "lucide-react";
import Link from "next/link";
import type { NoteRow } from "./types";

interface NoteDetailClientProps {
  note: NoteRow;
}

export function NoteDetailClient({ note }: NoteDetailClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState(note.tags);
  const [tagInput, setTagInput] = useState("");
  const [pinned, setPinned] = useState(note.pinned);
  const [archived, setArchived] = useState(note.archived);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  async function patchNote(payload: Record<string, unknown>) {
    const res = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setSavedAt(new Date());
  }

  function debouncedSave(payload: Record<string, unknown>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => patchNote(payload), 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleTitleBlur() {
    if (title !== note.title) patchNote({ title });
  }

  function handleEditorChange(json: unknown, text: string) {
    debouncedSave({ contentJson: json, contentText: text });
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
    patchNote({ tags: next });
  }

  function removeTag(t: string) {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    patchNote({ tags: next });
  }

  function togglePinned(v: boolean) {
    setPinned(v);
    patchNote({ pinned: v });
  }

  function toggleArchived(v: boolean) {
    setArchived(v);
    patchNote({ archived: v });
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir esta anotação?")) return;
    const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/blocks/notes");
      router.refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/blocks/notes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Salvo {savedAt.toLocaleTimeString()}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        placeholder="Título"
        className="text-xl font-semibold !border-0 !shadow-none !ring-0 px-0 focus-visible:ring-0"
      />

      <div className="flex items-center flex-wrap gap-2">
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1">
            {t}
            <button
              onClick={() => removeTag(t)}
              className="hover:text-destructive"
              aria-label={`Remove tag ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Adicionar tag…"
          className="h-7 w-40 text-xs"
        />
      </div>

      <NoteEditor
        initialJson={note.contentJson}
        onChange={handleEditorChange}
      />

      <div className="flex items-center gap-6 pt-2">
        <div className="flex items-center gap-2">
          <Switch
            id="pinned"
            checked={pinned}
            onCheckedChange={togglePinned}
          />
          <Label htmlFor="pinned" className="text-sm">
            Fixada
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="archived"
            checked={archived}
            onCheckedChange={toggleArchived}
          />
          <Label htmlFor="archived" className="text-sm">
            Arquivada
          </Label>
        </div>
        {note.entityType && note.entityId && (
          <div className="text-xs text-muted-foreground">
            Vinculada a: {note.entityType} ({note.entityId.slice(0, 8)}…)
          </div>
        )}
      </div>
    </div>
  );
}
