"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Bot,
  X,
  Loader2,
  SendHorizonal,
  User,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface BlockAgentPanelProps {
  /** Block name matching the manifest (e.g. "events", "products") */
  blockName: string;
  /** Display name for the header (e.g. "Events") */
  blockDisplayName: string;
}

// ─── Panel Width ────────────────────────────────────────────────

const PANEL_WIDTH = 380;

// ─── Component ──────────────────────────────────────────────────

export function BlockAgentPanel({
  blockName,
  blockDisplayName,
}: BlockAgentPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamingContent]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: content.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingContent("");

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const res = await fetch(`/api/chat/blocks/${blockName}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            history: [...messages, userMsg].slice(-20).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (eventType === "token") {
                  accumulated += data.text;
                  setStreamingContent(accumulated);
                } else if (eventType === "error") {
                  accumulated += `\n\n${data.message}`;
                  setStreamingContent(accumulated);
                }
              } catch {
                // skip
              }
            }
          }
        }

        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: accumulated,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("Block agent stream error:", e);
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        abortRef.current = null;
      }
    },
    [blockName, messages, isStreaming]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;
        const value = textarea.value.trim();
        if (!value) return;
        handleSend(value);
        textarea.value = "";
        textarea.style.height = "auto";
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }, []);

  // ─── Collapsed: just show the toggle button ──────────────────

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
        title={`Ask ${blockDisplayName} Agent`}
      >
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">{blockDisplayName} Agent</span>
      </button>
    );
  }

  // ─── Open: full panel ────────────────────────────────────────

  return (
    <div
      className="fixed right-0 top-0 z-50 flex h-screen flex-col border-l border-border bg-card shadow-2xl transition-all duration-200"
      style={{ width: PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-none">
              {blockDisplayName} Agent
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Specialist for this block
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">
              {blockDisplayName} Agent
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-[260px]">
              I&apos;m your specialist for everything {blockDisplayName.toLowerCase()}-related.
              Ask me anything about the data in this block.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2 mb-3",
              msg.role === "user" && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {msg.role === "user" ? (
                <User className="h-3 w-3" />
              ) : (
                <Bot className="h-3 w-3" />
              )}
            </div>
            <div
              className={cn(
                "rounded-xl px-3 py-2 text-sm leading-relaxed max-w-[85%]",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted rounded-tl-sm"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="flex gap-2 mb-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground mt-0.5">
              <Bot className="h-3 w-3" />
            </div>
            <div className="rounded-xl rounded-tl-sm bg-muted px-3 py-2 text-sm leading-relaxed max-w-[85%]">
              <p className="whitespace-pre-wrap">{streamingContent}</p>
              <span className="inline-block w-[2px] h-[1em] ml-0.5 bg-foreground animate-pulse" />
            </div>
          </div>
        )}

        {/* Loading */}
        {isStreaming && !streamingContent && (
          <div className="flex items-center gap-2 py-2 pl-8">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm">
          <textarea
            ref={textareaRef}
            placeholder={`Ask about ${blockDisplayName.toLowerCase()}...`}
            className={cn(
              "flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground",
              isStreaming && "opacity-50"
            )}
            rows={1}
            disabled={isStreaming}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
          />
          <button
            onClick={() => {
              const textarea = textareaRef.current;
              if (!textarea) return;
              const value = textarea.value.trim();
              if (!value) return;
              handleSend(value);
              textarea.value = "";
              textarea.style.height = "auto";
            }}
            disabled={isStreaming}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendHorizonal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
