"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  List,
  Columns3,
  Calendar,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { getTaskColumns } from "./task-columns";
import { TaskFilterBar, type TaskFilters } from "./task-filter-bar";
import { CreateTaskDialog } from "./create-task-dialog";
import { TaskKanbanView } from "./task-kanban-view";
import { TaskCalendarView } from "./task-calendar-view";
import type { TaskRow, TaskStatus } from "./types";

type ViewMode = "list" | "kanban" | "calendar";

interface TasksClientProps {
  initialTasks: TaskRow[];
  integrations: Array<{
    id: string;
    slug: string;
    name: string;
    status: string;
  }>;
}

export function TasksClient({ initialTasks, integrations }: TasksClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filters, setFilters] = useState<TaskFilters>({
    status: [],
    priority: [],
    source: null,
    search: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Derive available sources from integrations
  const availableSources = useMemo(
    () =>
      integrations
        .filter((i) => i.status === "CONNECTED")
        .map((i) => i.slug),
    [integrations]
  );

  // Client-side filtering
  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.projectName?.toLowerCase().includes(q) ||
          t.assignee?.toLowerCase().includes(q) ||
          t.labels.some((l) => l.toLowerCase().includes(q))
      );
    }

    if (filters.status.length > 0) {
      result = result.filter((t) => filters.status.includes(t.status));
    }

    if (filters.priority.length > 0) {
      result = result.filter((t) => filters.priority.includes(t.priority));
    }

    if (filters.source) {
      result = result.filter((t) => t.sourceIntegration === filters.source);
    }

    return result;
  }, [tasks, filters]);

  // Handlers
  const handleView = useCallback(
    (task: TaskRow) => {
      router.push(`/admin/blocks/tasks/${task.id}`);
    },
    [router]
  );

  const handleDelete = useCallback(async (task: TaskRow) => {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    }
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch("/api/tasks/sync", { method: "POST" });
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const { data } = await res.json();
        setTasks(data);
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleTaskCreated = useCallback((task: TaskRow) => {
    setTasks((prev) => [task, ...prev]);
    setDialogOpen(false);
  }, []);

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      }
    },
    []
  );

  const columns = getTaskColumns({
    onView: handleView,
    onDelete: handleDelete,
  });

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Manage and track tasks from all your tools"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1.5" />
              )}
              Sync Tasks
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Task
            </Button>
          </div>
        }
      />

      <div className="px-4 space-y-4">
        {/* Filter bar + view switcher */}
        <div className="flex items-center justify-between gap-4">
          <TaskFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            sources={availableSources}
          />

          {/* View switcher */}
          <div className="flex items-center rounded-lg bg-muted p-[3px]">
            {[
              { value: "list" as ViewMode, icon: List, label: "List" },
              { value: "kanban" as ViewMode, icon: Columns3, label: "Kanban" },
              {
                value: "calendar" as ViewMode,
                icon: Calendar,
                label: "Calendar",
              },
            ].map((v) => (
              <button
                key={v.value}
                onClick={() => setViewMode(v.value)}
                title={v.label}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === v.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <v.icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Views */}
        {viewMode === "list" && (
          <DataTable
            data={filteredTasks}
            columns={columns}
            emptyMessage="No tasks yet. Click 'New Task' to get started."
            onRowClick={handleView}
          />
        )}

        {viewMode === "kanban" && (
          <TaskKanbanView
            tasks={filteredTasks}
            onView={handleView}
            onStatusChange={handleStatusChange}
          />
        )}

        {viewMode === "calendar" && (
          <TaskCalendarView tasks={filteredTasks} onView={handleView} />
        )}
      </div>

      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onTaskCreated={handleTaskCreated}
      />
    </>
  );
}
