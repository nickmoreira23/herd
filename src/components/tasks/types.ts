export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
export type TaskPriority = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignee: string | null;
  assigneeEmail: string | null;
  projectName: string | null;
  labels: string[];
  sourceIntegration: string | null;
  sourceId: string | null;
  sourceUrl: string | null;
  sourceStatus: string | null;
  sourcePriority: string | null;
  parentTaskId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  BACKLOG: { label: "Backlog", className: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
  TODO: { label: "To Do", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  IN_REVIEW: { label: "In Review", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  DONE: { label: "Done", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  CANCELLED: { label: "Cancelled", className: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string; dotColor: string }> = {
  NONE: { label: "None", className: "text-zinc-400", dotColor: "bg-zinc-400" },
  LOW: { label: "Low", className: "text-blue-400", dotColor: "bg-blue-400" },
  MEDIUM: { label: "Medium", className: "text-amber-400", dotColor: "bg-amber-400" },
  HIGH: { label: "High", className: "text-orange-500", dotColor: "bg-orange-500" },
  URGENT: { label: "Urgent", className: "text-red-500", dotColor: "bg-red-500" },
};

export const SOURCE_LABELS: Record<string, string> = {
  asana: "Asana",
  trello: "Trello",
  jira: "Jira",
  notion: "Notion",
  linear: "Linear",
  monday: "Monday",
  clickup: "ClickUp",
};

export const KANBAN_COLUMNS: TaskStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
