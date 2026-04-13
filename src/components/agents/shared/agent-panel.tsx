"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Bot,
  X,
  Loader2,
  SendHorizonal,
  User,
  Sparkles,
  Trash2,
  AudioLines,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentConversation } from "@/hooks/use-agent-conversation";
import { MarkdownContent } from "./markdown-content";
import { ActivityFeed } from "./activity-feed";
import { StepIndicator } from "./step-indicator";
import { MediaInput, type PendingAttachment } from "./media-input";
import { MediaOutput } from "./media-output";
import { VoiceMode } from "./voice-mode";

// ─── Types ─────────────────────────────────────────────────────

export interface AgentPanelProps {
  /** Agent key (matches Agent.key in DB) */
  agentKey: string;
  /** Display name shown in header */
  displayName: string;
  /** Subtitle shown below display name */
  subtitle?: string;
  /** Gradient classes for icon (e.g. "from-violet-500 to-purple-600") */
  iconGradient?: string;
  /** Input placeholder text */
  placeholder?: string;
  /** Empty state description */
  emptyStateText?: string;
  /** Suggested prompt examples */
  suggestedPrompts?: string[];
  /** Panel width in pixels */
  panelWidth?: number;
  /** Called when a custom SSE event is received */
  onSSEEvent?: (event: string, data: Record<string, unknown>) => void;
  /** Multimodal input capabilities */
  accepts?: {
    images?: boolean;
    audio?: boolean;
    video?: boolean;
    documents?: boolean;
  };
  /** Enable voice input/output */
  enableVoice?: boolean;
  /** Called before each message send to capture live context (e.g. current editor state) */
  getContext?: () => Record<string, unknown> | undefined;
}

// ─── Component ─────────────────────────────────────────────────

export function AgentPanel({
  agentKey,
  displayName,
  subtitle,
  iconGradient = "from-violet-500 to-purple-600",
  placeholder = "Ask a question...",
  emptyStateText,
  suggestedPrompts = [],
  panelWidth = 400,
  onSSEEvent,
  accepts,
  enableVoice,
  getContext,
}: AgentPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [ttsText, setTtsText] = useState<string | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const {
    messages,
    isStreaming,
    streamingContent,
    stepText,
    activities,
    mediaOutputs,
    loadingHistory,
    conversationId,
    initConversation,
    handleSend,
    handleClearHistory,
  } = useAgentConversation(agentKey, { onSSEEvent, getContext });

  // Initialize on first open
  useEffect(() => {
    if (isOpen) initConversation();
  }, [isOpen, initConversation]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamingContent, stepText, activities]);

  // TTS playback when voice mode is active
  useEffect(() => {
    if (!ttsText) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/foundation/voice/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: ttsText }),
        });

        if (!res.ok || cancelled) return;

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        ttsAudioRef.current = audio;

        audio.onplay = () => setIsPlayingTTS(true);
        audio.onended = () => {
          setIsPlayingTTS(false);
          URL.revokeObjectURL(url);
          ttsAudioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlayingTTS(false);
          URL.revokeObjectURL(url);
          ttsAudioRef.current = null;
        };

        audio.play().catch(() => {});
      } catch {
        // TTS not available — silently degrade
      }
    })();

    return () => {
      cancelled = true;
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
    };
  }, [ttsText]);

  // Trigger TTS when assistant finishes responding in voice mode
  useEffect(() => {
    if (!voiceMode || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "assistant" && lastMsg.content && !isStreaming) {
      setTtsText(lastMsg.content);
    }
    // Only trigger when streaming ends (isStreaming goes false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  // ─── Keyboard handling ────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;
        const value = textarea.value.trim();
        if (!value) return;
        handleSend(value, pendingAttachments.length > 0 ? pendingAttachments : undefined);
        textarea.value = "";
        textarea.style.height = "auto";
        setPendingAttachments([]);
      }
    },
    [handleSend, pendingAttachments]
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }, []);

  const handleSendClick = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const value = textarea.value.trim();
    if (!value) return;
    handleSend(value, pendingAttachments.length > 0 ? pendingAttachments : undefined);
    textarea.value = "";
    textarea.style.height = "auto";
    setPendingAttachments([]);
  }, [handleSend, pendingAttachments]);

  const handleVoiceTranscript = useCallback(
    (text: string) => {
      if (voiceMode) {
        // Voice mode: auto-send transcribed text
        handleSend(text);
      } else {
        // Transcribe mode: append text to existing textarea content
        if (textareaRef.current) {
          const existing = textareaRef.current.value;
          const separator = existing && !existing.endsWith(" ") ? " " : "";
          textareaRef.current.value = existing + separator + text;
          handleInput();
        }
      }
    },
    [voiceMode, handleSend, handleInput]
  );

  // ─── Collapsed: floating button ──────────────────────────────

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
        title={`Open ${displayName}`}
      >
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">{displayName}</span>
      </button>
    );
  }

  // ─── Open: full panel ────────────────────────────────────────

  return (
    <div
      className="fixed right-0 top-0 z-50 flex h-screen flex-col border-l border-border bg-card shadow-2xl transition-all duration-200"
      style={{ width: panelWidth }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br",
              iconGradient
            )}
          >
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-none">
              {displayName}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Clear history"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {loadingHistory && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loadingHistory && messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br mb-3",
                iconGradient
                  .replace("from-violet-500", "from-violet-500/20")
                  .replace("to-purple-600", "to-purple-600/20")
              )}
            >
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <p className="text-sm font-medium">{displayName}</p>
            {emptyStateText && (
              <p className="mt-1 text-xs text-muted-foreground max-w-[280px]">
                {emptyStateText}
              </p>
            )}
            {suggestedPrompts.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {suggestedPrompts.map((example) => (
                  <button
                    key={example}
                    onClick={() => {
                      if (textareaRef.current) {
                        textareaRef.current.value = example;
                        handleInput();
                      }
                    }}
                    className="block mx-auto text-[11px] text-muted-foreground hover:text-foreground border rounded-full px-3 py-1 hover:bg-muted/50 transition-colors"
                  >
                    &ldquo;{example}&rdquo;
                  </button>
                ))}
              </div>
            )}
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
                  ? "bg-foreground text-background"
                  : cn("bg-gradient-to-br", iconGradient)
              )}
            >
              {msg.role === "user" ? (
                <User className="h-3 w-3" />
              ) : (
                <Bot className="h-3 w-3 text-white" />
              )}
            </div>
            {msg.role === "user" ? (
              <div className="rounded-xl rounded-tr-sm px-3 py-2 text-xs leading-relaxed max-w-[85%] bg-foreground text-background whitespace-pre-wrap">
                {msg.content}
              </div>
            ) : (
              <div className="rounded-xl rounded-tl-sm px-3 py-2 text-xs leading-relaxed max-w-[85%] bg-muted/50">
                {msg.content ? (
                  <MarkdownContent content={msg.content} />
                ) : (
                  <span className="text-muted-foreground italic">
                    Thinking...
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="flex gap-2 mb-3">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5 bg-gradient-to-br",
                iconGradient
              )}
            >
              <Bot className="h-3 w-3 text-white" />
            </div>
            <div className="rounded-xl rounded-tl-sm bg-muted/50 px-3 py-2 text-xs leading-relaxed max-w-[85%]">
              <MarkdownContent content={streamingContent} />
              <span className="inline-block w-[2px] h-[1em] ml-0.5 bg-foreground animate-pulse" />
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isStreaming && !streamingContent && !stepText && (
          <div className="flex items-center gap-2 py-2 pl-8">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Thinking...</span>
          </div>
        )}

        <StepIndicator text={stepText} />
        <ActivityFeed items={activities} />

        {/* Media outputs from generation tools */}
        {mediaOutputs.length > 0 && (
          <div className="py-2">
            <MediaOutput items={mediaOutputs} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        {accepts && (
          <MediaInput
            accepts={accepts}
            attachments={pendingAttachments}
            onAttach={(newAtts) =>
              setPendingAttachments((prev) => [...prev, ...newAtts])
            }
            onRemove={(id) =>
              setPendingAttachments((prev) => prev.filter((a) => a.id !== id))
            }
            disabled={isStreaming}
          />
        )}
        {enableVoice && voiceMode && (
          <div className="flex items-center gap-1.5 text-xs text-primary mb-1.5 px-1">
            <Volume2 className="h-3 w-3 animate-pulse" />
            <span>Voice mode active</span>
            {isPlayingTTS && (
              <span className="text-muted-foreground">— speaking...</span>
            )}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm">
          {enableVoice && (
            <VoiceMode
              onTranscript={handleVoiceTranscript}
              disabled={isStreaming}
              useServerSTT
            />
          )}
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            className={cn(
              "flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground",
              isStreaming && "opacity-50"
            )}
            rows={1}
            disabled={isStreaming}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
          />
          {enableVoice && (
            <button
              onClick={() => setVoiceMode((v) => !v)}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                voiceMode
                  ? "bg-primary text-primary-foreground animate-pulse"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              title={voiceMode ? "Disable voice mode" : "Enable voice mode"}
            >
              <AudioLines className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={handleSendClick}
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
