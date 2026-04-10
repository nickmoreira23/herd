"use client";

import { useState, useEffect, useCallback } from "react";
import { KNOWLEDGE_ITEM_TYPES, KNOWLEDGE_ITEM_STATUSES } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface KnowledgeItem {
  id: string;
  type: string;
  title: string;
  content: string | null;
  sourceUrl: string | null;
  fileKey: string | null;
  fileMimeType: string | null;
  fileSizeBytes: number | null;
  status: string;
  priority: number;
  sortOrder: number;
  metadata: unknown;
}

interface KnowledgeTabProps {
  agentId: string;
}

const TYPE_COLORS: Record<string, string> = {
  TEXT: "border-blue-500/50 bg-blue-500/10 text-blue-400",
  URL: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
  DOCUMENT: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  FAQ: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  API_REFERENCE: "border-purple-500/50 bg-purple-500/10 text-purple-400",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  DRAFT: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  PROCESSING: "border-blue-500/50 bg-blue-500/10 text-blue-400",
  ERROR: "border-red-500/50 bg-red-500/10 text-red-400",
  ARCHIVED: "border-zinc-500/50 bg-zinc-500/10 text-zinc-400",
};

export function KnowledgeTab({ agentId }: KnowledgeTabProps) {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/knowledge`);
      const json = await res.json();
      setItems(json.data || []);
    } catch {
      toast.error("Failed to load knowledge items");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TEXT",
          title: `Knowledge Item ${items.length + 1}`,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to create");
        return;
      }
      const json = await res.json();
      setItems((prev) => [...prev, json.data]);
      setExpanded((prev) => new Set(prev).add(json.data.id));
      toast.success("Item added");
    } catch {
      toast.error("Failed to create");
    }
  };

  const updateItem = async (
    itemId: string,
    field: string,
    value: unknown
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, [field]: value } : i))
    );
    try {
      const res = await fetch(
        `/api/agents/${agentId}/knowledge/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        }
      );
      if (!res.ok) toast.error("Failed to save");
    } catch {
      toast.error("Failed to save");
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await fetch(`/api/agents/${agentId}/knowledge/${itemId}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Loading knowledge base...
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Knowledge Base</span>
          <span className="text-xs text-muted-foreground ml-1">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={addItem}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Item
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isExpanded = expanded.has(item.id);
          return (
            <div
              key={item.id}
              className="rounded-lg border bg-card overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(item.id)}
                className="flex items-center gap-3 w-full text-left px-4 py-3"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${TYPE_COLORS[item.type] || ""}`}
                >
                  {item.type}
                </Badge>
                <span className="text-sm font-medium flex-1 truncate">
                  {item.title}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${STATUS_COLORS[item.status] || ""}`}
                >
                  {item.status}
                </Badge>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input
                        value={item.title}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((i) =>
                              i.id === item.id
                                ? { ...i, title: e.target.value }
                                : i
                            )
                          )
                        }
                        onBlur={() => updateItem(item.id, "title", item.title)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Type</Label>
                        <Select
                          value={item.type}
                          onValueChange={(val) =>
                            updateItem(item.id, "type", val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {KNOWLEDGE_ITEM_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Status</Label>
                        <Select
                          value={item.status}
                          onValueChange={(val) =>
                            updateItem(item.id, "status", val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {KNOWLEDGE_ITEM_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.charAt(0) + s.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {(item.type === "URL" ||
                    item.type === "DOCUMENT" ||
                    item.type === "API_REFERENCE") && (
                    <div className="space-y-1.5">
                      <Label>Source URL</Label>
                      <Input
                        value={item.sourceUrl || ""}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((i) =>
                              i.id === item.id
                                ? { ...i, sourceUrl: e.target.value }
                                : i
                            )
                          )
                        }
                        onBlur={() =>
                          updateItem(item.id, "sourceUrl", item.sourceUrl)
                        }
                        placeholder="https://..."
                      />
                    </div>
                  )}

                  {(item.type === "TEXT" || item.type === "FAQ") && (
                    <div className="space-y-1.5">
                      <Label>Content</Label>
                      <Textarea
                        value={item.content || ""}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((i) =>
                              i.id === item.id
                                ? { ...i, content: e.target.value }
                                : i
                            )
                          )
                        }
                        onBlur={() =>
                          updateItem(item.id, "content", item.content)
                        }
                        placeholder="Enter knowledge content..."
                        rows={6}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Priority</Label>
                      <Input
                        type="number"
                        value={item.priority}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((i) =>
                              i.id === item.id
                                ? {
                                    ...i,
                                    priority: parseInt(e.target.value) || 0,
                                  }
                                : i
                            )
                          )
                        }
                        onBlur={() =>
                          updateItem(item.id, "priority", item.priority)
                        }
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Higher = weighted more in retrieval
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-400"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No knowledge items yet. Add documents, URLs, or text snippets this
            agent can reference.
          </div>
        )}
      </div>
    </div>
  );
}
