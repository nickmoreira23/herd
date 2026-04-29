"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin, Archive } from "lucide-react";
import type { NoteRow } from "./types";

export function NoteCard({ note }: { note: NoteRow }) {
  const preview = note.contentText.trim().slice(0, 160);

  return (
    <Link href={`/admin/blocks/notes/${note.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="space-y-2 py-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold truncate">{note.title}</h3>
            <div className="flex items-center gap-1 shrink-0">
              {note.pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
              {note.archived && (
                <Archive className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
          {preview && (
            <p className="text-xs text-muted-foreground line-clamp-3">
              {preview}
            </p>
          )}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {note.tags.slice(0, 4).map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          )}
          {note.entityType && (
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {note.entityType}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
