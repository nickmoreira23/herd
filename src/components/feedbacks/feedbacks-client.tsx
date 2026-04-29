"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeedbacksKanban } from "./feedbacks-kanban";
import { CreateFeedbackDialog } from "./create-feedback-dialog";
import {
  FEEDBACK_TYPE_CONFIG,
  FEEDBACK_PRIORITY_CONFIG,
  type FeedbackRow,
} from "./types";

interface FeedbacksClientProps {
  initialFeedbacks: FeedbackRow[];
}

export function FeedbacksClient({ initialFeedbacks }: FeedbacksClientProps) {
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return feedbacks.filter((f) => {
      if (typeFilter !== "all" && f.type !== typeFilter) return false;
      if (priorityFilter !== "all" && f.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          f.title.toLowerCase().includes(q) ||
          f.contentText.toLowerCase().includes(q) ||
          (f.submitterName?.toLowerCase().includes(q) ?? false) ||
          f.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [feedbacks, search, typeFilter, priorityFilter]);

  async function handleUpvote(id: string) {
    setFeedbacks((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, voteCount: f.voteCount + 1 } : f
      )
    );
    const res = await fetch(`/api/feedbacks/${id}/upvote`, { method: "POST" });
    if (!res.ok) {
      // revert
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, voteCount: f.voteCount - 1 } : f
        )
      );
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Feedbacks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sugestões, bugs e ideias sobre o produto.
          </p>
        </div>
        <CreateFeedbackDialog />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Buscar por título, conteúdo, autor, tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(FEEDBACK_TYPE_CONFIG).map(([k, cfg]) => (
              <SelectItem key={k} value={k}>
                {cfg.emoji} {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as prioridades</SelectItem>
            {Object.entries(FEEDBACK_PRIORITY_CONFIG).map(([k, cfg]) => (
              <SelectItem key={k} value={k}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FeedbacksKanban feedbacks={filtered} onUpvote={handleUpvote} />
    </div>
  );
}
