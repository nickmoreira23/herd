"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskSourceBadge } from "./task-source-badge";
import {
  KANBAN_COLUMNS,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  type TaskRow,
  type TaskStatus,
} from "./types";

// ─── Props ──────────────────────────────────────────────────────────

interface TaskKanbanViewProps {
  tasks: TaskRow[];
  onView: (task: TaskRow) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

// ─── Status-to-column mapping ───────────────────────────────────────

function statusToColumn(status: TaskStatus): TaskStatus {
  if (KANBAN_COLUMNS.includes(status)) return status;
  // CANCELLED and any unknown status fall into TODO
  return "TODO";
}

// ─── Status border colors for cards ─────────────────────────────────

const STATUS_BORDER_COLORS: Record<TaskStatus, string> = {
  BACKLOG: "border-l-slate-500",
  TODO: "border-l-zinc-500",
  IN_PROGRESS: "border-l-blue-500",
  IN_REVIEW: "border-l-amber-500",
  DONE: "border-l-emerald-500",
  CANCELLED: "border-l-red-500",
};

// ─── Overdue check ──────────────────────────────────────────────────

function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === "DONE" || status === "CANCELLED") return false;
  return new Date(dueDate) < new Date();
}

function formatDueDate(dueDate: string): string {
  const d = new Date(dueDate);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ─── Sortable Card ──────────────────────────────────────────────────

function SortableTaskCard({
  task,
  onView,
}: {
  task: TaskRow;
  onView: (task: TaskRow) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onView={onView} />
    </div>
  );
}

// ─── Task Card ──────────────────────────────────────────────────────

function TaskCard({
  task,
  onView,
}: {
  task: TaskRow;
  onView: (task: TaskRow) => void;
}) {
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <button
      type="button"
      onClick={() => onView(task)}
      className={`w-full text-left rounded-lg border border-l-[3px] bg-card p-3 shadow-sm hover:shadow-md hover:bg-muted/40 transition-all cursor-pointer ${STATUS_BORDER_COLORS[task.status] || "border-l-zinc-500"}`}
    >
      {/* Title */}
      <p className="text-sm font-medium truncate">{task.title}</p>

      {/* Meta row: priority dot + assignee + due date */}
      <div className="flex items-center gap-2 mt-1.5">
        <span
          className={`inline-block h-2 w-2 rounded-full shrink-0 ${priorityConfig.dotColor}`}
          title={priorityConfig.label}
        />
        {task.assignee && (
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
            {task.assignee}
          </span>
        )}
        {task.dueDate && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
              overdue
                ? "bg-red-500/10 text-red-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>

      {/* Source badge */}
      {task.sourceIntegration && (
        <div className="flex justify-end mt-1.5">
          <TaskSourceBadge source={task.sourceIntegration} />
        </div>
      )}
    </button>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────

function KanbanColumn({
  status,
  tasks,
  onView,
}: {
  status: TaskStatus;
  tasks: TaskRow[];
  onView: (task: TaskRow) => void;
}) {
  const config = TASK_STATUS_CONFIG[status];
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="flex flex-col min-w-[260px] w-[260px] shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 px-2 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {config.label}
        </h3>
        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          className="flex-1 space-y-2 min-h-[80px] p-1 rounded-lg"
          data-column-status={status}
        >
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground">
              No tasks
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onView={onView} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function TaskKanbanView({
  tasks,
  onView,
  onStatusChange,
}: TaskKanbanViewProps) {
  const [activeTask, setActiveTask] = useState<TaskRow | null>(null);

  // Sensors with distance constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks into columns
  const columnTasks = useMemo(() => {
    const map: Record<TaskStatus, TaskRow[]> = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
      CANCELLED: [],
    };
    for (const task of tasks) {
      const col = statusToColumn(task.status);
      map[col].push(task);
    }
    return map;
  }, [tasks]);

  // Find which column a task ID belongs to
  const findColumnForTask = useCallback(
    (taskId: string): TaskStatus | null => {
      for (const status of KANBAN_COLUMNS) {
        if (columnTasks[status].some((t) => t.id === taskId)) {
          return status;
        }
      }
      return null;
    },
    [columnTasks]
  );

  // DnD handlers
  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as TaskRow | undefined;
    setActiveTask(task || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;

    // Determine target column:
    // 1. If dropped over another task card, find that task's column
    // 2. If dropped over the column droppable area, use data-column-status
    let targetStatus: TaskStatus | null = null;

    if (over.data.current?.type === "task") {
      const overTask = over.data.current.task as TaskRow;
      targetStatus = statusToColumn(overTask.status);
    } else {
      // The over element might be a task in a different column
      targetStatus = findColumnForTask(over.id as string);
    }

    if (!targetStatus) return;

    const sourceStatus = findColumnForTask(taskId);
    if (sourceStatus === targetStatus) return;

    onStatusChange(taskId, targetStatus);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columnTasks[status]}
            onView={onView}
          />
        ))}
      </div>

      {/* Drag overlay — floating card that follows the cursor */}
      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeTask && <TaskCard task={activeTask} onView={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
}
