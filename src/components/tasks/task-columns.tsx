"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { TaskSourceBadge } from "./task-source-badge";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  type TaskRow,
  type TaskStatus,
  type TaskPriority,
} from "./types";

interface ColumnActions {
  onView: (task: TaskRow) => void;
  onDelete: (task: TaskRow) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getTaskColumns(actions: ColumnActions): ColumnDef<TaskRow>[] {
  return [
    {
      accessorKey: "title",
      header: () => <span className="text-xs font-medium">Title</span>,
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{task.title}</span>
              <TaskSourceBadge source={task.sourceIntegration} />
            </div>
            {task.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {task.description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs">Status</span>,
      cell: ({ row }) => {
        const status = row.original.status as TaskStatus;
        const config = TASK_STATUS_CONFIG[status] || TASK_STATUS_CONFIG.TODO;
        return (
          <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: () => <span className="text-xs">Priority</span>,
      cell: ({ row }) => {
        const priority = row.original.priority as TaskPriority;
        const config = TASK_PRIORITY_CONFIG[priority] || TASK_PRIORITY_CONFIG.NONE;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
            <span className={`text-sm ${config.className}`}>{config.label}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "assignee",
      header: () => <span className="text-xs">Assignee</span>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.assignee || "-"}
        </span>
      ),
    },
    {
      accessorKey: "projectName",
      header: () => <span className="text-xs">Project</span>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.projectName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: () => <span className="text-xs font-medium">Due Date</span>,
      cell: ({ row }) => {
        const dueDate = row.original.dueDate;
        if (!dueDate) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
        const isOverdue =
          new Date(dueDate) < new Date() && row.original.status !== "DONE" && row.original.status !== "CANCELLED";
        return (
          <span className={`text-sm ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
            {formatDate(dueDate)}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(task)}>
                <Eye className="mr-2 h-3.5 w-3.5" />
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => actions.onDelete(task)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
