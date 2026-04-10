"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Loader2,
  Bot,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PlanBuilderChatProps {
  tierId: string;
  onRulesChanged: () => void;
  onClose: () => void;
}

export function PlanBuilderChat({
  tierId,
  onRulesChanged,
  onClose,
}: PlanBuilderChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [stepText, setStepText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, stepText, scrollToBottom]);

  async function handleSend() {
    const content = input.trim();
    if (!content || streaming) return;

    const userMessage: Message = { role: "user", content };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setStreaming(true);
    setStepText(null);

    try {
      const res = await fetch(`/api/subscriptions/${tierId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          history: messages,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${(json as { error?: string }).error || res.statusText}`,
          },
        ]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";
      let pendingEvent = "";

      // Add empty assistant message to fill in
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            pendingEvent = line.slice(7);
          } else if (line.startsWith("data: ") && pendingEvent) {
            const eventName = pendingEvent;
            pendingEvent = "";

            let data: Record<string, unknown>;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            switch (eventName) {
              case "token":
                assistantContent += data.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
                break;
              case "step":
                setStepText(data.text as string);
                break;
              case "step_complete":
                setStepText(null);
                break;
              case "rules_changed":
                onRulesChanged();
                break;
              case "error":
                assistantContent += `\n\nError: ${data.message}`;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
                break;
              case "done":
                break;
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1).length === prev.length ? prev : prev.slice(0, -1),
        {
          role: "assistant",
          content: `Connection error: ${err instanceof Error ? err.message : "Unknown error"}`,
        },
      ]);
    } finally {
      setStreaming(false);
      setStepText(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Bot className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">Plan Builder Ready</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Tell me what discount rules you want to create. For example:
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                "Add all supplements at 40% off to members store",
                "Products under 25% margin → members rate at 15% off",
                "Add Protein sub-category at 35% off to members store",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setInput(example)}
                  className="block mx-auto text-[11px] text-muted-foreground hover:text-foreground border rounded-full px-3 py-1 hover:bg-muted/50 transition-colors"
                >
                  &ldquo;{example}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2.5",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3 w-3 text-white" />
              </div>
            )}
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-foreground text-background"
                  : "bg-muted/50"
              )}
            >
              {msg.content || (
                <span className="text-muted-foreground italic">
                  Thinking...
                </span>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Step indicator */}
        {stepText && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {stepText}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the rules you want to create..."
            className="text-xs"
            disabled={streaming}
            autoFocus
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || streaming}
            className="shrink-0"
          >
            {streaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
