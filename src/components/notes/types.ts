export interface NoteRow {
  id: string;
  title: string;
  contentJson: unknown;
  contentText: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  updatedAt: string;
}
