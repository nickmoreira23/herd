"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Bot, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

interface ChatVoiceInterfaceProps {
  onSend: (message: string) => void;
  onExit: () => void;
  isStreaming: boolean;
  /** Text to synthesize and speak */
  ttsText: string | null;
  /** Report TTS playing state to parent */
  onPlayingTTSChange: (playing: boolean) => void;
}

type VoiceState = "listening" | "processing" | "thinking" | "speaking";

// VAD config
const SILENCE_THRESHOLD = 0.015;
const SILENCE_DURATION_MS = 1800;
const MIN_RECORDING_MS = 500;
const SPEECH_THRESHOLD = 0.02;

// ─── Inject keyframes once ────────────────────────────────────

let keyframesInjected = false;
function ensureKeyframes() {
  if (keyframesInjected) return;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes voiceWavePulse {
      0%, 100% { transform: scaleY(0.3); opacity: 0.3; }
      50% { transform: scaleY(1); opacity: 0.8; }
    }
  `;
  document.head.appendChild(style);
  keyframesInjected = true;
}

// ─── Sound Wave Ring ──────────────────────────────────────────

function SoundWaveRing({
  active,
  audioLevel,
  size = 180,
  barCount = 48,
}: {
  active: boolean;
  audioLevel: number;
  size?: number;
  barCount?: number;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { ensureKeyframes(); }, []);

  const orbRadius = 56; // half of the 112px orb
  const barGap = 6;
  const barStart = orbRadius + barGap;
  const maxBarLen = (size / 2) - barStart;
  const intensity = Math.min(audioLevel * 12, 1);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {Array.from({ length: barCount }).map((_, i) => {
          const angle = (i / barCount) * 360;
          const rad = (angle * Math.PI) / 180;
          // Each bar varies slightly for organic look
          const variance = Math.sin(i * 1.3) * 0.3 + 0.7;
          const barLen = active
            ? 4 + intensity * maxBarLen * variance
            : 4;

          const x1 = size / 2 + Math.cos(rad) * barStart;
          const y1 = size / 2 + Math.sin(rad) * barStart;
          const x2 = size / 2 + Math.cos(rad) * (barStart + barLen);
          const y2 = size / 2 + Math.sin(rad) * (barStart + barLen);

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-75",
                active ? "text-primary" : "text-muted-foreground/15"
              )}
              style={{
                opacity: active ? 0.3 + intensity * 0.7 : 0.15,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────

export function ChatVoiceInterface({
  onSend,
  onExit,
  isStreaming,
  ttsText,
  onPlayingTTSChange,
}: ChatVoiceInterfaceProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("listening");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [ttsAudioLevel, setTtsAudioLevel] = useState(0); // Only from agent's TTS output

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // VAD refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number>(0);
  const speechDetectedRef = useRef(false);

  // TTS playback refs
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAnalyserRef = useRef<AnalyserNode | null>(null);
  const ttsContextRef = useRef<AudioContext | null>(null);
  const ttsAnimFrameRef = useRef<number | null>(null);
  const ttsSourceCreatedRef = useRef(false);

  // Stable callback refs — avoid stale closures in MediaRecorder.onstop
  const onSendRef = useRef(onSend);
  useEffect(() => { onSendRef.current = onSend; }, [onSend]);

  // Lifecycle
  const mountedRef = useRef(true);
  const shouldAutoListenRef = useRef(false);
  const lastTtsTextRef = useRef<string | null>(null);
  const startRecordingRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (ttsAnimFrameRef.current) cancelAnimationFrame(ttsAnimFrameRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close().catch(() => {});
    ttsAudioRef.current?.pause();
  }, []);

  // ─── VAD: Voice Activity Detection on mic input ──────────────

  const startVAD = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Float32Array(analyser.fftSize);
    silenceStartRef.current = null;
    speechDetectedRef.current = false;

    const tick = () => {
      if (!mountedRef.current) return;

      analyser.getFloatTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
      const rms = Math.sqrt(sum / dataArray.length);
      // VAD only — don't drive wave visualization (that's for TTS output only)

      const now = Date.now();
      const elapsed = now - recordingStartRef.current;

      if (rms > SPEECH_THRESHOLD) {
        speechDetectedRef.current = true;
        silenceStartRef.current = null;
      }

      if (speechDetectedRef.current && elapsed > MIN_RECORDING_MS && rms < SILENCE_THRESHOLD) {
        if (!silenceStartRef.current) {
          silenceStartRef.current = now;
        } else if (now - silenceStartRef.current > SILENCE_DURATION_MS) {
          // Silence after speech — auto-stop
          mediaRecorderRef.current?.stop();
          return;
        }
      } else if (rms >= SILENCE_THRESHOLD) {
        silenceStartRef.current = null;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopVAD = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
  }, []);

  // ─── Recording ───────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      recordingStartRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopVAD();
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (!mountedRef.current) return;

        if (chunksRef.current.length === 0 || !speechDetectedRef.current) {
          // No speech — restart
          if (mountedRef.current) startRecordingRef.current?.();
          return;
        }

        setVoiceState("processing");

        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", blob, "recording.webm");

          const res = await fetch("/api/foundation/voice/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!mountedRef.current) return;

          if (res.ok) {
            const json = await res.json();
            const text = json.data?.result?.text?.trim();
            if (text) {
              setTranscript(text);
              // Use ref to always get the latest onSend (avoids stale closure)
              onSendRef.current(text);
              // Immediately transition — don't wait for isStreaming prop
              setVoiceState("thinking");
            } else {
              if (mountedRef.current) startRecordingRef.current?.();
            }
          } else {
            console.error("Transcription failed:", res.status);
            if (mountedRef.current) startRecordingRef.current?.();
          }
        } catch (err) {
          console.error("Voice transcription error:", err);
          if (mountedRef.current) startRecordingRef.current?.();
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setVoiceState("listening");
      startVAD(stream);
    } catch (err) {
      console.error("Microphone access denied:", err);
      // Don't retry on permission denied — stay in listening state visually
    }
  }, [startVAD, stopVAD]);

  // Keep ref in sync
  useEffect(() => { startRecordingRef.current = startRecording; }, [startRecording]);

  // ─── TTS Playback with audio analysis ────────────────────────

  const playTTS = useCallback(
    async (text: string) => {
      setVoiceState("speaking");
      onPlayingTTSChange(true);
      setTtsAudioLevel(0);

      try {
        const res = await fetch("/api/foundation/voice/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!res.ok || !mountedRef.current) {
          console.error("TTS synthesis failed:", res.status);
          onPlayingTTSChange(false);
          if (mountedRef.current) startRecordingRef.current?.();
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        ttsAudioRef.current = audio;

        // Set up Web Audio API analyser to visualize the agent's voice
        const ctx = new AudioContext();
        ttsContextRef.current = ctx;

        // Wait for audio to be ready before creating source
        await new Promise<void>((resolve) => {
          audio.oncanplaythrough = () => resolve();
          audio.load();
        });

        if (!mountedRef.current) {
          URL.revokeObjectURL(url);
          ctx.close();
          return;
        }

        // Only create MediaElementSource once per audio element
        if (!ttsSourceCreatedRef.current) {
          const source = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.4;
          source.connect(analyser);
          analyser.connect(ctx.destination);
          ttsAnalyserRef.current = analyser;
          ttsSourceCreatedRef.current = true;
        }

        // Start audio level monitoring for wave visualization
        const analyser = ttsAnalyserRef.current;
        if (analyser) {
          const dataArray = new Float32Array(analyser.fftSize);
          const tick = () => {
            if (!mountedRef.current) return;
            analyser.getFloatTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
            const rms = Math.sqrt(sum / dataArray.length);
            setTtsAudioLevel(rms);
            ttsAnimFrameRef.current = requestAnimationFrame(tick);
          };
          ttsAnimFrameRef.current = requestAnimationFrame(tick);
        }

        audio.onended = () => {
          if (ttsAnimFrameRef.current) cancelAnimationFrame(ttsAnimFrameRef.current);
          setTtsAudioLevel(0);
          URL.revokeObjectURL(url);
          ttsAudioRef.current = null;
          ttsSourceCreatedRef.current = false;
          ttsContextRef.current?.close().catch(() => {});
          ttsContextRef.current = null;
          ttsAnalyserRef.current = null;
          onPlayingTTSChange(false);

          // Auto-listen after agent finishes speaking
          if (mountedRef.current) {
            setTimeout(() => {
              if (mountedRef.current) startRecordingRef.current?.();
            }, 400);
          }
        };

        audio.onerror = () => {
          if (ttsAnimFrameRef.current) cancelAnimationFrame(ttsAnimFrameRef.current);
          setTtsAudioLevel(0);
          URL.revokeObjectURL(url);
          ttsAudioRef.current = null;
          ttsSourceCreatedRef.current = false;
          ttsContextRef.current?.close().catch(() => {});
          ttsContextRef.current = null;
          onPlayingTTSChange(false);
          if (mountedRef.current) startRecordingRef.current?.();
        };

        await audio.play();
      } catch (err) {
        console.error("TTS playback error:", err);
        onPlayingTTSChange(false);
        if (mountedRef.current) startRecording();
      }
    },
    [onPlayingTTSChange]
  );

  // ─── Auto-start listening on mount ────────────────────────────

  useEffect(() => {
    startRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── React to external state changes ─────────────────────────

  // When ttsText changes, play it
  useEffect(() => {
    if (!ttsText || ttsText === lastTtsTextRef.current) return;
    lastTtsTextRef.current = ttsText;

    console.log("[VoiceInterface] ttsText received, playing TTS...");

    // Stop any active recording before playing TTS
    if (mediaRecorderRef.current?.state === "recording") {
      // Prevent onstop from auto-restarting
      speechDetectedRef.current = false;
      mediaRecorderRef.current.stop();
    }
    stopVAD();

    playTTS(ttsText);
  }, [ttsText, playTTS, stopVAD]);

  // Safety net: if stuck in "thinking" for 45s with no ttsText, go back to listening
  useEffect(() => {
    if (voiceState !== "thinking") return;
    const timeout = setTimeout(() => {
      if (mountedRef.current && voiceState === "thinking") {
        console.warn("[VoiceInterface] Stuck in thinking state — restarting listener");
        setVoiceState("listening");
        startRecordingRef.current?.();
      }
    }, 45000);
    return () => clearTimeout(timeout);
  }, [voiceState]);

  // ─── Handle exit ──────────────────────────────────────────────

  const handleExit = useCallback(() => {
    mountedRef.current = false;
    stopVAD();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ttsAudioRef.current?.pause();
    if (ttsAnimFrameRef.current) cancelAnimationFrame(ttsAnimFrameRef.current);
    ttsContextRef.current?.close().catch(() => {});
    onPlayingTTSChange(false);
    onExit();
  }, [onExit, stopVAD, onPlayingTTSChange]);

  // ─── Render ───────────────────────────────────────────────────

  const stateLabel: Record<VoiceState, string> = {
    listening: "Listening...",
    processing: "Processing...",
    thinking: "Thinking...",
    speaking: "Speaking...",
  };

  const stateHint: Record<VoiceState, string> = {
    listening: "Speak naturally — I'll know when you're done",
    processing: "Transcribing your message",
    thinking: "Preparing a response",
    speaking: "",
  };

  // Sound waves only react to the agent's voice (TTS), not the user's mic
  const isWaveActive = voiceState === "speaking";
  const isOrbActive = voiceState === "listening" || voiceState === "speaking";

  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full relative">
      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute top-4 right-4 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
        Exit
      </button>

      {/* Transcript — what the user said */}
      {transcript && voiceState !== "listening" && (
        <div className="mb-6 max-w-sm text-center">
          <p className="text-sm text-muted-foreground italic">
            &ldquo;{transcript}&rdquo;
          </p>
        </div>
      )}

      {/* Central agent orb with sound waves */}
      <div className="relative mb-8" style={{ width: 180, height: 180 }}>
        {/* Sound wave ring — centered around the orb, reacts to real audio */}
        <SoundWaveRing
          active={isWaveActive}
          audioLevel={ttsAudioLevel}
          size={180}
          barCount={48}
        />

        {/* Agent avatar orb */}
        <div
          className={cn(
            "absolute rounded-full flex items-center justify-center transition-all duration-300 shadow-xl",
            isOrbActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
          style={{
            width: 112,
            height: 112,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {voiceState === "processing" || voiceState === "thinking" ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : (
            <Bot className="h-12 w-12" />
          )}
        </div>
      </div>

      {/* State label */}
      <p className="text-sm font-medium">{stateLabel[voiceState]}</p>
      {stateHint[voiceState] && (
        <p className="mt-1 text-xs text-muted-foreground">{stateHint[voiceState]}</p>
      )}
    </div>
  );
}
