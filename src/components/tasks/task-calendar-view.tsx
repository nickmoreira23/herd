"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  type TaskRow,
  type TaskStatus,
} from "./types";

// ─── Props ──────────────────────────────────────────────────────────

interface TaskCalendarViewProps {
  tasks: TaskRow[];
  onView: (task: TaskRow) => void;
}

// ─── Status bar colors (border-left) ────────────────────────────────

const STATUS_BAR_COLORS: Record<TaskStatus, string> = {
  BACKLOG: "rgb(100 116 139)",    // slate-500
  TODO: "rgb(113 113 122)",       // zinc-500
  IN_PROGRESS: "rgb(59 130 246)", // blue-500
  IN_REVIEW: "rgb(245 158 11)",   // amber-500
  DONE: "rgb(16 185 129)",        // emerald-500
  CANCELLED: "rgb(239 68 68)",    // red-500
};

// ─── Main Component ─────────────────────────────────────────────────

export function TaskCalendarView({ tasks, onView }: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthLabel = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Group tasks by day (only tasks with a dueDate)
  const tasksByDay = useMemo(() => {
    const map = new Map<number, TaskRow[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const d = new Date(task.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        const list = map.get(day) || [];
        list.push(task);
        map.set(day, list);
      }
    }
    return map;
  }, [tasks, year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const cells: React.ReactNode[] = [];

  // Empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push(
      <div
        key={`empty-${i}`}
        className="min-h-[100px] border-b border-r border-border"
      />
    );
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayTasks = tasksByDay.get(day) || [];
    cells.push(
      <div
        key={day}
        className="min-h-[100px] border-b border-r border-border p-1"
      >
        <div
          className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
            isToday(day)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}
        >
          {day}
        </div>
        <div className="space-y-0.5">
          {dayTasks.slice(0, 3).map((task) => {
            const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
            return (
              <button
                key={task.id}
                onClick={() => onView(task)}
                className="w-full text-left rounded px-1 py-0.5 text-[10px] leading-tight truncate hover:bg-muted/80 transition-colors flex items-center gap-1"
                style={{
                  borderLeft: "2px solid",
                  borderColor:
                    STATUS_BAR_COLORS[task.status] || STATUS_BAR_COLORS.TODO,
                }}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${priorityConfig.dotColor}`}
                />
                <span className="font-medium truncate">{task.title}</span>
              </button>
            );
          })}
          {dayTasks.length > 3 && (
            <p className="text-[10px] text-muted-foreground px-1">
              +{dayTasks.length - 3} more
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs h-7 px-2"
          >
            Today
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-l border-t border-border rounded-t-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-xs font-medium text-muted-foreground text-center py-2 border-b border-r border-border bg-muted/30"
          >
            {d}
          </div>
        ))}
        {cells}
      </div>
    </div>
  );
}
