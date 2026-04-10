"use client";

import { useState } from "react";
import { Plus, Search, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  model: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: { content: string; role: string; createdAt: string } | null;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ChatSidebar({
  conversations,
  selectedId,
  onSelect,
  onNew,
  onDelete,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = search
    ? conversations.filter(
        (c) =>
          c.title?.toLowerCase().includes(search.toLowerCase()) ||
          c.lastMessage?.content.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="hidden md:flex h-full w-[280px] flex-col border-r bg-muted/30">
      <div className="flex items-center gap-2 p-3 border-b">
        <button
          onClick={onNew}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-xs">
              {search ? "No matching chats" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filtered.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group relative flex flex-col rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
                  selectedId === conv.id
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                )}
                onClick={() => onSelect(conv.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {conv.title || "New Chat"}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDate(conv.updatedAt)}
                  </span>
                </div>
                {conv.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.lastMessage.content}
                  </p>
                )}

                {deleteConfirm === conv.id ? (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.id);
                        setDeleteConfirm(null);
                      }}
                      className="rounded bg-destructive px-2 py-0.5 text-[10px] text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(null);
                      }}
                      className="rounded bg-muted px-2 py-0.5 text-[10px] hover:bg-muted/80"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(conv.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
