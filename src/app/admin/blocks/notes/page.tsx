import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { NotesClient } from "@/components/notes/notes-client";
import type { NoteRow } from "@/components/notes/types";
import NotesLoading from "./loading";
import { connection } from "next/server";

async function NotesContent() {
  await connection();
  const notes = await prisma.note.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: 200,
  });

  const serialized: NoteRow[] = notes.map((n) => ({
    id: n.id,
    title: n.title,
    contentJson: n.contentJson,
    contentText: n.contentText,
    tags: n.tags,
    pinned: n.pinned,
    archived: n.archived,
    entityType: n.entityType,
    entityId: n.entityId,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }));

  return <NotesClient initialNotes={serialized} />;
}

export default function NotesPage() {
  return (
    <Suspense fallback={<NotesLoading />}>
      <NotesContent />
    </Suspense>
  );
}
