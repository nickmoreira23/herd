export type FeedbackType =
  | "SUGGESTION"
  | "BUG"
  | "COMPLAINT"
  | "PRAISE"
  | "QUESTION"
  | "IDEA";

export type FeedbackStatus =
  | "NEW"
  | "TRIAGED"
  | "PLANNED"
  | "IN_PROGRESS"
  | "DONE"
  | "DECLINED";

export type FeedbackPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface FeedbackRow {
  id: string;
  title: string;
  contentJson: unknown;
  contentText: string;
  type: FeedbackType;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  source: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  tags: string[];
  voteCount: number;
  entityType: string | null;
  entityId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const FEEDBACK_TYPE_CONFIG: Record<
  FeedbackType,
  { label: string; emoji: string }
> = {
  SUGGESTION: { label: "Sugestão", emoji: "💡" },
  BUG: { label: "Bug", emoji: "🐛" },
  COMPLAINT: { label: "Reclamação", emoji: "⚠️" },
  PRAISE: { label: "Elogio", emoji: "❤️" },
  QUESTION: { label: "Pergunta", emoji: "❓" },
  IDEA: { label: "Ideia", emoji: "✨" },
};

export const FEEDBACK_STATUS_CONFIG: Record<
  FeedbackStatus,
  { label: string; color: string; borderColor: string }
> = {
  NEW: { label: "Novo", color: "bg-zinc-100 text-zinc-700", borderColor: "border-l-zinc-500" },
  TRIAGED: { label: "Triado", color: "bg-purple-100 text-purple-700", borderColor: "border-l-purple-500" },
  PLANNED: { label: "Planejado", color: "bg-amber-100 text-amber-700", borderColor: "border-l-amber-500" },
  IN_PROGRESS: { label: "Em progresso", color: "bg-blue-100 text-blue-700", borderColor: "border-l-blue-500" },
  DONE: { label: "Concluído", color: "bg-emerald-100 text-emerald-700", borderColor: "border-l-emerald-500" },
  DECLINED: { label: "Recusado", color: "bg-red-100 text-red-700", borderColor: "border-l-red-500" },
};

export const FEEDBACK_PRIORITY_CONFIG: Record<
  FeedbackPriority,
  { label: string; dot: string }
> = {
  LOW: { label: "Baixa", dot: "bg-blue-400" },
  MEDIUM: { label: "Média", dot: "bg-amber-400" },
  HIGH: { label: "Alta", dot: "bg-orange-500" },
  URGENT: { label: "Urgente", dot: "bg-red-600" },
};

export const KANBAN_COLUMNS: FeedbackStatus[] = [
  "NEW",
  "TRIAGED",
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "DECLINED",
];
