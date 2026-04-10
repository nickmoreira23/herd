"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatEmptyState } from "./chat-empty-state";
import { ModelSelector } from "./model-selector";
import { Loader2 } from "lucide-react";
import type { ArtifactMeta } from "@/lib/chat/types";
import { ThinkingSteps, type ThinkingStep } from "./thinking-steps";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model: string | null;
  sources: Array<{ type: string; id: string; name: string }> | null;
  artifacts: ArtifactMeta[] | null;
  steps?: ThinkingStep[] | null;
  createdAt: string;
}

interface ChatInterfaceProps {
  conversationId: string | null;
  model: string;
  onModelChange: (model: string) => void;
  onFirstMessage: (conversationId: string) => void;
  onTitleUpdate: (conversationId: string, title: string) => void;
  onArtifactClick?: (artifact: ArtifactMeta) => void;
  selectedArtifactId?: string | null;
}

export function ChatInterface({
  conversationId,
  model,
  onModelChange,
  onFirstMessage,
  onTitleUpdate,
  onArtifactClick,
  selectedArtifactId,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingSources, setStreamingSources] = useState<
    Array<{ type: string; id: string; name: string }>
  >([]);
  const [streamingArtifacts, setStreamingArtifacts] = useState<ArtifactMeta[]>([]);
  const [streamingSteps, setStreamingSteps] = useState<ThinkingStep[]>([]);
  const [statusText, setStatusText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/chat/conversations/${conversationId}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data?.messages) {
          setMessages(json.data.messages);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSend = useCallback(
    async (content: string) => {
      let activeConversationId = conversationId;

      // Create conversation if needed
      if (!activeConversationId) {
        try {
          const res = await fetch("/api/chat/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model }),
          });
          const json = await res.json();
          if (!json.data?.id) return;
          activeConversationId = json.data.id as string;
          onFirstMessage(activeConversationId);
        } catch (e) {
          console.error("Failed to create conversation:", e);
          return;
        }
      }

      // Add user message to UI
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        model: null,
        sources: null,
        artifacts: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setStreamingContent("");
      setStreamingSources([]);
      setStreamingArtifacts([]);
      setStreamingSteps([]);
      setStatusText(null);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const res = await fetch(
          `/api/chat/conversations/${activeConversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
            signal: abortController.signal,
          }
        );

        if (!res.ok || !res.body) {
          console.error("Stream request failed:", res.status);
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        let sources: Array<{ type: string; id: string; name: string }> = [];
        let artifacts: ArtifactMeta[] = [];
        let steps: ThinkingStep[] = [];

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
              const dataStr = line.slice(6);
              try {
                const data = JSON.parse(dataStr);

                if (eventType === "token") {
                  accumulated += data.text;
                  setStreamingContent(accumulated);
                  setStatusText(null);
                } else if (eventType === "step") {
                  const newStep: ThinkingStep = {
                    id: data.id,
                    text: data.text,
                    phase: data.phase,
                    status: "active" as const,
                  };
                  steps = [...steps, newStep];
                  setStreamingSteps(steps);
                  setStatusText(data.text);
                } else if (eventType === "step_complete") {
                  steps = steps.map((s) =>
                    s.id === data.id
                      ? { ...s, status: "complete" as const, resultText: data.resultText }
                      : s
                  );
                  setStreamingSteps(steps);
                  setStatusText(null);
                } else if (eventType === "artifacts") {
                  artifacts = data as ArtifactMeta[];
                  setStreamingArtifacts(artifacts);
                } else if (eventType === "sources") {
                  sources = data;
                  setStreamingSources(data);
                } else if (eventType === "status") {
                  setStatusText(data.text);
                } else if (eventType === "title") {
                  onTitleUpdate(activeConversationId!, data.title);
                } else if (eventType === "error") {
                  accumulated += `\n\n⚠️ ${data.message}`;
                  setStreamingContent(accumulated);
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }

        // Finalize: add assistant message
        const assistantMessage: Message = {
          id: `resp-${Date.now()}`,
          role: "assistant",
          content: accumulated,
          model,
          sources: sources.length > 0 ? sources : null,
          artifacts: artifacts.length > 0 ? artifacts : null,
          steps: steps.length > 0 ? steps : null,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("Streaming error:", e);
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        setStreamingSources([]);
        setStreamingArtifacts([]);
        // Don't clear steps - they persist to show what the agent did
        setStatusText(null);
        abortRef.current = null;
      }
    },
    [conversationId, model, onFirstMessage, onTitleUpdate]
  );

  // No conversation selected and no messages — show empty state
  if (!conversationId && messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col h-full">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">
            New Chat
          </span>
          <ModelSelector value={model} onChange={onModelChange} />
        </div>
        <ChatEmptyState onSendMessage={handleSend} />
        <div className="p-4 border-t">
          <ChatInput onSend={handleSend} disabled={isStreaming} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">Chat</span>
        <ModelSelector
          value={model}
          onChange={onModelChange}
          disabled={isStreaming}
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role as "user" | "assistant"}
                content={msg.content}
                sources={msg.sources}
                artifacts={msg.artifacts}
                steps={msg.steps}
                onArtifactClick={onArtifactClick}
                selectedArtifactId={selectedArtifactId}
              />
            ))}
            {/* Thinking steps — shown during streaming and briefly after */}
            {isStreaming && streamingSteps.length > 0 && (
              <div className="py-2 pl-11">
                <ThinkingSteps steps={streamingSteps} isStreaming={isStreaming} />
              </div>
            )}
            {isStreaming && streamingContent && (
              <ChatMessage
                role="assistant"
                content={streamingContent}
                sources={streamingSources.length > 0 ? streamingSources : null}
                artifacts={streamingArtifacts.length > 0 ? streamingArtifacts : null}
                onArtifactClick={onArtifactClick}
                selectedArtifactId={selectedArtifactId}
                isStreaming
              />
            )}
            {isStreaming && !streamingContent && streamingSteps.length === 0 && (
              <div className="flex items-center gap-2 py-4 pl-11">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 border-t">
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
