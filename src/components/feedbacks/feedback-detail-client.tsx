"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NoteEditor } from "@/components/notes/note-editor";
import { ArrowLeft, Trash2, X, ChevronUp } from "lucide-react";
import {
  FEEDBACK_TYPE_CONFIG,
  FEEDBACK_STATUS_CONFIG,
  FEEDBACK_PRIORITY_CONFIG,
  type FeedbackRow,
  type FeedbackType,
  type FeedbackStatus,
  type FeedbackPriority,
} from "./types";

interface FeedbackDetailClientProps {
  feedback: FeedbackRow;
}

export function FeedbackDetailClient({ feedback }: FeedbackDetailClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(feedback.title);
  const [type, setType] = useState<FeedbackType>(feedback.type);
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status);
  const [priority, setPriority] = useState<FeedbackPriority>(feedback.priority);
  const [submitterName, setSubmitterName] = useState(
    feedback.submitterName ?? ""
  );
  const [submitterEmail, setSubmitterEmail] = useState(
    feedback.submitterEmail ?? ""
  );
  const [source, setSource] = useState(feedback.source ?? "");
  const [tags, setTags] = useState(feedback.tags);
  const [tagInput, setTagInput] = useState("");
  const [voteCount, setVoteCount] = useState(feedback.voteCount);
  const [resolvedAt, setResolvedAt] = useState(feedback.resolvedAt);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  async function patchFeedback(payload: Record<string, unknown>) {
    const res = await fetch(`/api/feedbacks/${feedback.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      setSavedAt(new Date());
      if (json.data?.resolvedAt !== undefined) {
        setResolvedAt(json.data.resolvedAt);
      }
    }
  }

  function debouncedSave(payload: Record<string, unknown>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => patchFeedback(payload), 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleEditorChange(json: unknown, text: string) {
    debouncedSave({ contentJson: json, contentText: text });
  }

  function changeStatus(v: FeedbackStatus) {
    setStatus(v);
    patchFeedback({ status: v });
  }

  function changeType(v: FeedbackType) {
    setType(v);
    patchFeedback({ type: v });
  }

  function changePriority(v: FeedbackPriority) {
    setPriority(v);
    patchFeedback({ priority: v });
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
    patchFeedback({ tags: next });
  }

  function removeTag(t: string) {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    patchFeedback({ tags: next });
  }

  async function handleUpvote() {
    setVoteCount((v) => v + 1);
    const res = await fetch(`/api/feedbacks/${feedback.id}/upvote`, {
      method: "POST",
    });
    if (!res.ok) setVoteCount((v) => v - 1);
  }

  async function handleDelete() {
    if (!confirm("Excluir este feedback?")) return;
    const res = await fetch(`/api/feedbacks/${feedback.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/blocks/feedbacks");
      router.refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/blocks/feedbacks"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Salvo {savedAt.toLocaleTimeString()}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="sm"
          className="h-auto flex-col gap-0 px-3 py-2 shrink-0"
          onClick={handleUpvote}
        >
          <ChevronUp className="h-4 w-4" />
          <span className="text-sm font-semibold">{voteCount}</span>
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title !== feedback.title) patchFeedback({ title });
          }}
          placeholder="Título"
          className="text-xl font-semibold !border-0 !shadow-none !ring-0 px-0 focus-visible:ring-0"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Tipo</label>
          <Select value={type} onValueChange={(v) => changeType(v as FeedbackType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FEEDBACK_TYPE_CONFIG).map(([k, cfg]) => (
                <SelectItem key={k} value={k}>
                  {cfg.emoji} {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <Select value={status} onValueChange={(v) => changeStatus(v as FeedbackStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FEEDBACK_STATUS_CONFIG).map(([k, cfg]) => (
                <SelectItem key={k} value={k}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Prioridade</label>
          <Select
            value={priority}
            onValueChange={(v) => changePriority(v as FeedbackPriority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FEEDBACK_PRIORITY_CONFIG).map(([k, cfg]) => (
                <SelectItem key={k} value={k}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Quem enviou</label>
          <Input
            value={submitterName}
            onChange={(e) => setSubmitterName(e.target.value)}
            onBlur={() =>
              patchFeedback({ submitterName: submitterName || null })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">E-mail</label>
          <Input
            type="email"
            value={submitterEmail}
            onChange={(e) => setSubmitterEmail(e.target.value)}
            onBlur={() =>
              patchFeedback({ submitterEmail: submitterEmail || null })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Origem</label>
          <Input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            onBlur={() => patchFeedback({ source: source || null })}
            placeholder="ex: app, twitter"
          />
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1">
            {t}
            <button
              onClick={() => removeTag(t)}
              className="hover:text-destructive"
              aria-label={`Remove tag ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Adicionar tag…"
          className="h-7 w-40 text-xs"
        />
      </div>

      <NoteEditor
        initialJson={feedback.contentJson}
        onChange={handleEditorChange}
      />

      {(feedback.entityType || resolvedAt) && (
        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          {feedback.entityType && feedback.entityId && (
            <div>
              Vinculado a: {feedback.entityType} (
              {feedback.entityId.slice(0, 8)}…)
            </div>
          )}
          {resolvedAt && (
            <div>Resolvido em: {new Date(resolvedAt).toLocaleString()}</div>
          )}
        </div>
      )}
    </div>
  );
}
