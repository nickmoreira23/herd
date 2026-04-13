"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlockListPage } from "@/components/shared/block-list-page";
import { getTaskColumns } from "./task-columns";
import { TaskFilterBar, type TaskFilters } from "./task-filter-bar";
import { CreateTaskDialog } from "./create-task-dialog";
import { TaskKanbanView } from "./task-kanban-view";
import { TaskCalendarView } from "./task-calendar-view";
import type { TaskRow, TaskStatus } from "./types";

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

  // Client-side filtering (pre-filter before passing to BlockListPage)
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

  const headerActions = (
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
  );

  return (
    <BlockListPage<TaskRow>
      blockName="tasks"
      title="Tasks"
      description="Manage and track tasks from all your tools"
      data={filteredTasks}
      getId={(t) => t.id}
      columns={columns}
      onRowClick={handleView}
      headerActions={headerActions}
      afterToolbar={
        <div className="px-4 pb-4">
          <TaskFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            sources={availableSources}
          />
        </div>
      }
      additionalViews={[
        {
          type: "kanban" as const,
          render: (data) => (
            <TaskKanbanView
              tasks={data}
              onView={handleView}
              onStatusChange={handleStatusChange}
            />
          ),
        },
        {
          type: "calendar" as const,
          render: (data) => (
            <TaskCalendarView tasks={data} onView={handleView} />
          ),
        },
      ]}
      modals={
        <CreateTaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onTaskCreated={handleTaskCreated}
        />
      }
      emptyTitle="No tasks found"
      emptyDescription="Create a task or sync from your project management tools."
    />
  );
}
