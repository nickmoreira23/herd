"use client";

import { FeedbackCard } from "./feedback-card";
import {
  KANBAN_COLUMNS,
  FEEDBACK_STATUS_CONFIG,
  type FeedbackRow,
} from "./types";

interface FeedbacksKanbanProps {
  feedbacks: FeedbackRow[];
  onUpvote: (id: string) => void;
}

export function FeedbacksKanban({ feedbacks, onUpvote }: FeedbacksKanbanProps) {
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {KANBAN_COLUMNS.map((status) => {
        const items = feedbacks.filter((f) => f.status === status);
        const cfg = FEEDBACK_STATUS_CONFIG[status];
        return (
          <div key={status} className="space-y-2 min-w-0">
            <div className="flex items-center justify-between sticky top-0 bg-background py-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide">
                {cfg.label}
              </h3>
              <span className="text-xs text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((f) => (
                <FeedbackCard key={f.id} feedback={f} onUpvote={onUpvote} />
              ))}
              {items.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded">
                  Vazio
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
