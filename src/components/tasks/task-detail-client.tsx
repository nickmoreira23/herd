"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  FolderOpen,
  ExternalLink,
  Clock,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TaskSourceBadge } from "./task-source-badge";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  SOURCE_LABELS,
  type TaskRow,
  type TaskStatus,
  type TaskPriority,
} from "./types";

interface TaskDetailClientProps {
  initialTask: TaskRow;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskDetailClient({ initialTask }: TaskDetailClientProps) {
  const router = useRouter();
  const [task, setTask] = useState<TaskRow>(initialTask);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const status = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.TODO;
  const priority = TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.NONE;

  const handleStatusChange = useCallback(
    async (newStatus: TaskStatus) => {
      setUpdatingStatus(true);
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          const { data } = await res.json();
          setTask((prev) => ({ ...prev, ...data }));
        }
      } finally {
        setUpdatingStatus(false);
      }
    },
    [task.id]
  );

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE" &&
    task.status !== "CANCELLED";

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-start gap-4 pl-4 pt-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/admin/blocks/tasks")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {task.title}
            </h1>
            <Badge
              variant="outline"
              className={`text-xs font-medium shrink-0 ${status.className}`}
            >
              {status.label}
            </Badge>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`h-2 w-2 rounded-full ${priority.dotColor}`} />
              <span className={`text-xs font-medium ${priority.className}`}>
                {priority.label}
              </span>
            </div>
          </div>
          {task.sourceIntegration && (
            <div className="flex items-center gap-2 mt-2">
              <TaskSourceBadge source={task.sourceIntegration} />
              {task.sourceUrl && (
                <a
                  href={task.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open in {SOURCE_LABELS[task.sourceIntegration] || task.sourceIntegration}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Description, Labels, Source Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          {task.description ? (
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">Description</h2>
              </div>
              <div className="p-4">
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {task.description}
                </p>
              </div>
            </Card>
          ) : (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">
                No description provided.
              </p>
            </Card>
          )}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Labels</h2>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {task.labels.map((label, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/20"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Source Info */}
          {task.sourceIntegration && (
            <Card className="p-0">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">Source Information</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">
                    Source
                  </span>
                  <TaskSourceBadge source={task.sourceIntegration} />
                </div>
                {task.sourceUrl && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">
                      URL
                    </span>
                    <a
                      href={task.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 truncate"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {task.sourceUrl}
                    </a>
                  </div>
                )}
                {task.sourceStatus && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">
                      Original Status
                    </span>
                    <span className="text-xs text-foreground">
                      {task.sourceStatus}
                    </span>
                  </div>
                )}
                {task.sourcePriority && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">
                      Original Priority
                    </span>
                    <span className="text-xs text-foreground">
                      {task.sourcePriority}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right column: Metadata + Status change */}
        <div className="space-y-4">
          {/* Metadata card */}
          <Card className="p-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Details</h2>
            </div>
            <div className="p-4 space-y-3">
              {/* Assignee */}
              <div className="flex items-center gap-3">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-16 shrink-0">
                  Assignee
                </span>
                <span className="text-sm">
                  {task.assignee || "Unassigned"}
                </span>
              </div>

              {/* Project */}
              <div className="flex items-center gap-3">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-16 shrink-0">
                  Project
                </span>
                <span className="text-sm">
                  {task.projectName || "None"}
                </span>
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-3">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-16 shrink-0">
                  Due Date
                </span>
                <span
                  className={`text-sm ${isOverdue ? "text-red-500 font-medium" : ""}`}
                >
                  {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                </span>
              </div>

              {/* Created */}
              <div className="flex items-center gap-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-16 shrink-0">
                  Created
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDateTime(task.createdAt)}
                </span>
              </div>

              {/* Updated */}
              <div className="flex items-center gap-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-16 shrink-0">
                  Updated
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDateTime(task.updatedAt)}
                </span>
              </div>

              {/* Completed At */}
              {task.completedAt && (
                <div className="flex items-center gap-3">
                  <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs text-muted-foreground w-16 shrink-0">
                    Done
                  </span>
                  <span className="text-sm text-emerald-500">
                    {formatDateTime(task.completedAt)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Status change */}
          <Card className="p-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Update Status</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {(
                Object.entries(TASK_STATUS_CONFIG) as [
                  TaskStatus,
                  { label: string; className: string },
                ][]
              ).map(([value, config]) => (
                <Button
                  key={value}
                  variant={task.status === value ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  disabled={updatingStatus || task.status === value}
                  onClick={() => handleStatusChange(value)}
                >
                  {config.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Open in source */}
          {task.sourceUrl && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    Open in{" "}
                    {SOURCE_LABELS[task.sourceIntegration || ""] ||
                      task.sourceIntegration ||
                      "Source"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {task.sourceUrl}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  render={
                    <a
                      href={task.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
