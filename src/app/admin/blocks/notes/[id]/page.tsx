import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NoteDetailClient } from "@/components/notes/note-detail-client";
import type { NoteRow } from "@/components/notes/types";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) notFound();

  const serialized: NoteRow = {
    id: note.id,
    title: note.title,
    contentJson: note.contentJson,
    contentText: note.contentText,
    tags: note.tags,
    pinned: note.pinned,
    archived: note.archived,
    entityType: note.entityType,
    entityId: note.entityId,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };

  return <NoteDetailClient note={serialized} />;
}
