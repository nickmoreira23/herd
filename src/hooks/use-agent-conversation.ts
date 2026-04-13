"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ActivityItem } from "@/components/agents/shared/activity-feed";
import type { MediaOutputItem } from "@/components/agents/shared/media-output";
import type { PendingAttachment } from "@/components/agents/shared/media-input";

// ─── Types ─────────────────────────────────────────────────────

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface SSECallbacks {
  /** Called when a custom event is received (e.g. plan_updated, navigate) */
  onSSEEvent?: (event: string, data: Record<string, unknown>) => void;
  /** Called before each message send to get dynamic context (e.g. live editor state) */
  getContext?: () => Record<string, unknown> | undefined;
}

// ─── Hook ──────────────────────────────────────────────────────

export function useAgentConversation(
  agentKey: string,
  callbacks?: SSECallbacks
) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [stepText, setStepText] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [mediaOutputs, setMediaOutputs] = useState<MediaOutputItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const initRef = useRef(false);
  const apiEndpoint = `/api/chat/agents/${agentKey}/messages`;

  // ─── Initialize ────────────────────────────────────────────────

  const initConversation = useCallback(async () => {
    if (initRef.current || conversationId) return;
    initRef.current = true;
    setLoadingHistory(true);

    try {
      // The unified API auto-creates conversations, but we need to
      // find existing one to load history. Use the conversations API.
      const listRes = await fetch("/api/chat/conversations");
      if (!listRes.ok) throw new Error("Failed to load conversations");
      const listData = await listRes.json();
      const convos = listData.data as Array<{
        id: string;
        title: string | null;
        agentId: string | null;
      }>;

      // Find by agent key pattern: check agentId or title sentinel
      // The agentId approach requires knowing the agent's DB ID.
      // For now, we use the sentinel title pattern as a fallback.
      const sentinel = `[${agentKey}]`;
      let convo = convos.find(
        (c) => c.title === sentinel
      );

      if (convo) {
        setConversationId(convo.id);

        // Load existing messages
        const msgRes = await fetch(`/api/chat/conversations/${convo.id}`);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          const msgs = msgData.data?.messages as
            | Array<{
                id: string;
                role: string;
                content: string;
                createdAt: string;
              }>
            | undefined;
          if (msgs && msgs.length > 0) {
            setMessages(
              msgs.map((m) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
                createdAt: m.createdAt,
              }))
            );
          }
        }
      }
      // If no existing conversation, it will be created on first send
    } catch (err) {
      console.error(`[${agentKey}] Init error:`, err);
    } finally {
      setLoadingHistory(false);
    }
  }, [agentKey, conversationId]);

  // ─── Send Message ──────────────────────────────────────────────

  const handleSend = useCallback(
    async (content: string, attachments?: PendingAttachment[]) => {
      if (!content.trim() || isStreaming) return;

      const userMsg: AgentMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: content.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingContent("");
      setStepText(null);
      setActivities([]);
      setMediaOutputs([]);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        // Capture live context right before sending (e.g. current editor state)
        const liveContext = callbacks?.getContext?.();

        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(conversationId ? { conversationId } : {}),
            content: content.trim(),
            ...(liveContext ? { context: liveContext } : {}),
            ...(attachments && attachments.length > 0
              ? {
                  attachments: attachments.map((a) => ({
                    type: a.type,
                    url: a.fileUrl,
                    mimeType: a.mimeType,
                    fileName: a.fileName,
                  })),
                }
              : {}),
          }),
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          const json = await res.json().catch(() => ({}));
          setMessages((prev) => [
            ...prev,
            {
              id: `e-${Date.now()}`,
              role: "assistant",
              content: `Error: ${(json as { error?: string }).error || res.statusText}`,
            },
          ]);
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        let eventType = "";
        let hadChanges = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ") && eventType) {
              const currentEvent = eventType;
              eventType = "";

              let data: Record<string, unknown>;
              try {
                data = JSON.parse(line.slice(6));
              } catch {
                continue;
              }

              switch (currentEvent) {
                case "token":
                  accumulated += data.text;
                  setStreamingContent(accumulated);
                  break;
                case "step":
                  setStepText(data.text as string);
                  break;
                case "step_complete":
                  setStepText(null);
                  break;
                case "activity":
                  hadChanges = true;
                  setActivities((prev) => [
                    ...prev,
                    {
                      type: data.type as ActivityItem["type"],
                      label: data.label as string,
                    },
                  ]);
                  callbacks?.onSSEEvent?.(currentEvent, data);
                  break;
                case "media_output":
                  setMediaOutputs((prev) => [
                    ...prev,
                    {
                      type: data.type as MediaOutputItem["type"],
                      url: data.url as string,
                      mimeType: data.mimeType as string | undefined,
                      fileName: data.fileName as string | undefined,
                      title: data.title as string | undefined,
                    },
                  ]);
                  callbacks?.onSSEEvent?.(currentEvent, data);
                  break;
                case "error":
                  accumulated += `\n\nError: ${data.message}`;
                  setStreamingContent(accumulated);
                  break;
                case "done":
                  break;
                default:
                  // Custom events (plan_updated, navigate, rule_created, etc.)
                  if (
                    [
                      "plan_updated",
                      "rule_created",
                      "rule_deleted",
                      "benefits_updated",
                    ].includes(currentEvent)
                  ) {
                    hadChanges = true;

                    // Build activity item from domain event
                    let label = currentEvent;
                    let type: ActivityItem["type"] = "updated";
                    if (currentEvent === "rule_created") {
                      label = `${data.scopeType}: ${data.scopeValue} — ${data.discountPercent}% off`;
                      type = "created";
                    } else if (currentEvent === "rule_deleted") {
                      label = "Rule removed";
                      type = "deleted";
                    } else if (currentEvent === "plan_updated") {
                      const updatedFields = data.updatedFields as
                        | Record<string, unknown>
                        | undefined;
                      const fieldNames = updatedFields
                        ? Object.keys(updatedFields)
                        : [];
                      label = `Updated ${fieldNames.join(", ") || "fields"} on ${data.planName}`;
                      type = "created";
                    } else if (currentEvent === "benefits_updated") {
                      label = `Updated ${data.blockName} benefits`;
                      type = "created";
                    }

                    setActivities((prev) => [...prev, { type, label }]);
                  }
                  callbacks?.onSSEEvent?.(currentEvent, data);
                  break;
              }
            }
          }
        }

        // Finalize assistant message
        if (accumulated) {
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              content: accumulated,
            },
          ]);

          // If we didn't have a conversationId before, try to find it now
          // (it was auto-created on the server side)
          if (!conversationId) {
            try {
              const listRes = await fetch("/api/chat/conversations");
              if (listRes.ok) {
                const listData = await listRes.json();
                const convos = listData.data as Array<{
                  id: string;
                  agentId: string | null;
                }>;
                // Find the most recent conversation (just created)
                if (convos.length > 0) {
                  setConversationId(convos[0].id);
                }
              }
            } catch {
              // Not critical
            }
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        void hadChanges; // Available for future use
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error(`[${agentKey}] Stream error:`, e);
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        setStepText(null);
        abortRef.current = null;
      }
    },
    [agentKey, apiEndpoint, conversationId, isStreaming, callbacks]
  );

  // ─── Clear History ─────────────────────────────────────────────

  const handleClearHistory = useCallback(async () => {
    if (!conversationId) return;

    try {
      await fetch(`/api/chat/conversations/${conversationId}`, {
        method: "DELETE",
      });

      setConversationId(null);
      setMessages([]);
      setActivities([]);
      initRef.current = false;
    } catch (err) {
      console.error(`[${agentKey}] Clear history error:`, err);
    }
  }, [agentKey, conversationId]);

  // ─── Cancel Stream ─────────────────────────────────────────────

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    conversationId,
    messages,
    isStreaming,
    streamingContent,
    stepText,
    activities,
    mediaOutputs,
    loadingHistory,
    initConversation,
    handleSend,
    handleClearHistory,
    cancelStream,
  };
}
