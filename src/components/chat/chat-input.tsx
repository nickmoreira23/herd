"use client";

import { useRef, useCallback, type KeyboardEvent } from "react";
import { SendHorizonal, AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceMode } from "@/components/agents/shared/voice-mode";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  /** Show mic button for voice-to-text transcription */
  enableVoice?: boolean;
  /** When true, transcribed text auto-sends and responses are spoken back */
  voiceMode?: boolean;
  /** Toggle voice mode on/off */
  onVoiceModeToggle?: () => void;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled,
  enableVoice,
  voiceMode,
  onVoiceModeToggle,
  placeholder = "Ask about your knowledge base...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const value = textarea.value.trim();
    if (!value || disabled) return;
    onSend(value);
    textarea.value = "";
    textarea.style.height = "auto";
  }, [onSend, disabled]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  }, []);

  const handleVoiceTranscript = useCallback(
    (text: string) => {
      if (voiceMode) {
        // Voice mode: auto-send transcribed text
        onSend(text);
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
    [voiceMode, onSend, handleInput]
  );

  return (
    <div className="flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm">
      {enableVoice && (
        <VoiceMode
          onTranscript={handleVoiceTranscript}
          disabled={disabled}
          useServerSTT
        />
      )}
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        className={cn(
          "flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground",
          disabled && "opacity-50"
        )}
        rows={1}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
      />
      {enableVoice && onVoiceModeToggle && (
        <button
          onClick={onVoiceModeToggle}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
            voiceMode
              ? "bg-primary text-primary-foreground animate-pulse"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          title={voiceMode ? "Disable voice mode" : "Enable voice mode"}
        >
          <AudioLines className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={handleSend}
        disabled={disabled}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SendHorizonal className="h-4 w-4" />
      </button>
    </div>
  );
}
