"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { MeetingRow } from "./types";

interface InPersonRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (meeting: MeetingRow) => void;
}

type RecorderState = "idle" | "recording" | "uploading" | "processing";

export function InPersonRecorder({
  open,
  onOpenChange,
  onComplete,
}: InPersonRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [title, setTitle] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopTimer();
      stopStream();
    };
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setState("idle");
      setTitle("");
      setElapsed(0);
      setError(null);
      chunksRef.current = [];
    } else {
      stopTimer();
      stopStream();
    }
  }, [open]);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }

  function formatElapsed(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Choose best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(1000); // Collect data every second
      setState("recording");
      startTimeRef.current = Date.now();

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not access microphone";
      if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        setError("Microphone access was denied. Please allow microphone access in your browser settings.");
      } else {
        setError(message);
      }
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    return new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
      stopTimer();
      stopStream();
    });
  }, []);

  const handleStopAndUpload = useCallback(async () => {
    await stopRecording();

    const meetingTitle = title.trim() || `Meeting ${new Date().toLocaleDateString()}`;

    if (chunksRef.current.length === 0) {
      setError("No audio was recorded.");
      setState("idle");
      return;
    }

    setState("uploading");

    try {
      // Step 1: Create the meeting record
      const createRes = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meetingTitle,
          meetingType: "IN_PERSON",
          platform: "IN_PERSON",
          status: "RECORDING",
          startedAt: new Date(startTimeRef.current).toISOString(),
          endedAt: new Date().toISOString(),
        }),
      });

      if (!createRes.ok) {
        throw new Error("Failed to create meeting record");
      }

      const { data: meeting } = await createRes.json();

      // Step 2: Upload audio
      const blob = new Blob(chunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || "audio/webm",
      });
      const formData = new FormData();
      formData.append("file", blob, `recording_${Date.now()}.webm`);

      const uploadRes = await fetch(`/api/meetings/${meeting.id}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload audio");
      }

      // Step 3: Trigger processing (transcription)
      setState("processing");

      const processRes = await fetch(`/api/meetings/${meeting.id}/process`, {
        method: "POST",
      });

      if (!processRes.ok) {
        // Processing failed but meeting + audio were saved — navigate to it
        const errBody = await processRes.json().catch(() => null);
        const errMsg = errBody?.error || "Transcription failed";
        // Still navigate to the meeting so the user can see it and retry
        onComplete({ ...meeting, status: "ERROR", errorMessage: errMsg });
        return;
      }

      const { data: processed } = await processRes.json();

      // Step 4: Trigger summarization if transcript is available
      if (processed.transcript && processed.status === "READY") {
        try {
          const sumRes = await fetch(`/api/meetings/${meeting.id}/summarize`, {
            method: "POST",
          });
          if (sumRes.ok) {
            const { data: summarized } = await sumRes.json();
            onComplete(summarized);
            return;
          }
        } catch {
          // Summarization is optional — continue with transcribed meeting
        }
      }

      onComplete(processed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      setState("idle");
    }
  }, [title, stopRecording, onComplete]);

  const isRecording = state === "recording";
  const isBusy = state === "uploading" || state === "processing";

  return (
    <Dialog open={open} onOpenChange={isBusy ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record In-Person Meeting</DialogTitle>
          <DialogDescription>
            Record audio from your microphone. The recording will be
            automatically transcribed and summarized.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="meeting-title">Meeting Title</Label>
            <Input
              id="meeting-title"
              placeholder="e.g. Weekly Team Standup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isRecording || isBusy}
            />
          </div>

          {/* Recording indicator */}
          <div className="flex flex-col items-center gap-3 py-4">
            {isRecording && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-sm font-medium text-red-500">
                  Recording
                </span>
              </div>
            )}

            <span className="text-3xl font-mono tabular-nums tracking-tight">
              {formatElapsed(elapsed)}
            </span>

            {isBusy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {state === "uploading" ? "Uploading audio..." : "Transcribing..."}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {state === "idle" && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={startRecording}>
                <Mic className="h-4 w-4 mr-1.5" />
                Start Recording
              </Button>
            </>
          )}

          {isRecording && (
            <Button
              variant="destructive"
              onClick={handleStopAndUpload}
              className="w-full"
            >
              <Square className="h-4 w-4 mr-1.5" />
              Stop & Transcribe
            </Button>
          )}

          {isBusy && (
            <Button disabled className="w-full">
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              {state === "uploading" ? "Uploading..." : "Transcribing..."}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
