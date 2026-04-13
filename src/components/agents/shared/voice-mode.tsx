"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

interface VoiceModeProps {
  /** Called with transcribed text */
  onTranscript: (text: string) => void;
  /** Called when TTS audio should play */
  audioUrl?: string | null;
  /** Text to synthesize via TTS (alternative to audioUrl) */
  ttsText?: string | null;
  disabled?: boolean;
  /** Use server-side STT via voice service instead of browser SpeechRecognition */
  useServerSTT?: boolean;
}

// ─── Component ─────────────────────────────────────────────────

export function VoiceMode({
  onTranscript,
  audioUrl,
  ttsText,
  disabled,
  useServerSTT = false,
}: VoiceModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // ─── Server-side STT Recording ─────────────────────────────

  const startServerRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        if (chunksRef.current.length === 0) {
          setIsListening(false);
          return;
        }

        setIsProcessing(true);

        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", blob, "recording.webm");

          const res = await fetch("/api/foundation/voice/transcribe", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const json = await res.json();
            const text = json.data?.result?.text;
            if (text) onTranscript(text);
          }
        } catch (err) {
          console.error("Server STT failed:", err);
        }

        setIsProcessing(false);
        setIsListening(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [onTranscript]);

  const stopServerRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  // ─── Browser Speech Recognition (fallback) ────────────────

  const startBrowserListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript as string | undefined;
      if (transcript) {
        onTranscript(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onTranscript]);

  const stopBrowserListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // ─── Unified start/stop ────────────────────────────────────

  const startListening = useServerSTT ? startServerRecording : startBrowserListening;
  const stopListening = useServerSTT ? stopServerRecording : stopBrowserListening;

  // ─── Auto-play TTS response (from audioUrl) ────────────────

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);

    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  // ─── Auto-synthesize TTS from text ─────────────────────────

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
        audioRef.current = audio;

        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
        };

        audio.play().catch(() => {});
      } catch {
        // TTS not available — silently degrade
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ttsText]);

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="flex items-center gap-1">
      {/* Mic button */}
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={disabled || isProcessing}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
          isListening
            ? "bg-red-500 text-white animate-pulse"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          (disabled || isProcessing) && "opacity-50 cursor-not-allowed"
        )}
        title={
          isProcessing
            ? "Processing..."
            : isListening
              ? "Stop recording"
              : "Voice input"
        }
      >
        {isProcessing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-3.5 w-3.5" />
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Playing indicator */}
      {isPlaying && (
        <Volume2 className="h-3.5 w-3.5 text-primary animate-pulse" />
      )}
    </div>
  );
}
