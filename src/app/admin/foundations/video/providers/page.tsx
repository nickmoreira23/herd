"use client";

import { useState, useEffect } from "react";

interface VideoConfig {
  transcription: { primary: string; fallbacks?: string[] };
  generation: { primary: string; fallbacks?: string[] };
  storage: { primary: string; fallbacks?: string[] };
  defaults: {
    transcriptionModel: string;
    language: string;
    diarize: boolean;
    maxDurationSec: number;
    allowedFormats: string[];
  };
}

const TRANSCRIPTION_PROVIDERS = [
  { slug: "deepgram", name: "Deepgram", models: ["nova-3", "nova-2", "enhanced", "base"] },
];

const GENERATION_PROVIDERS = [
  { slug: "runway", name: "Runway", models: ["gen3a_turbo"] },
  { slug: "heygen", name: "HeyGen", models: ["v5_avatar"] },
];

const STORAGE_PROVIDERS = [
  { slug: "local", name: "Local Filesystem" },
];

export default function VideoProvidersPage() {
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/foundation/video/config")
      .then((r) => r.json())
      .then((json) => setConfig(json.data))
      .catch(() => {});
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/foundation/video/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setMessage("Configuration saved.");
      } else {
        setMessage("Failed to save.");
      }
    } catch {
      setMessage("Failed to save.");
    }
    setSaving(false);
  };

  if (!config) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Video Providers</h1>
        <p className="text-muted-foreground">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Video Providers</h1>
          <p className="text-muted-foreground mt-1">
            Configure which providers handle each video capability.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message && (
        <div className="rounded-md border px-4 py-2 text-sm">{message}</div>
      )}

      {/* Transcription Config */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold">Transcription</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium block mb-1">Primary Provider</label>
            <select
              value={config.transcription.primary}
              onChange={(e) =>
                setConfig({
                  ...config,
                  transcription: { ...config.transcription, primary: e.target.value },
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {TRANSCRIPTION_PROVIDERS.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Model</label>
            <select
              value={config.defaults.transcriptionModel}
              onChange={(e) =>
                setConfig({
                  ...config,
                  defaults: { ...config.defaults, transcriptionModel: e.target.value },
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {TRANSCRIPTION_PROVIDERS.find(
                (p) => p.slug === config.transcription.primary
              )?.models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Language</label>
            <input
              type="text"
              value={config.defaults.language}
              onChange={(e) =>
                setConfig({
                  ...config,
                  defaults: { ...config.defaults, language: e.target.value },
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="en"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="diarize"
              checked={config.defaults.diarize}
              onChange={(e) =>
                setConfig({
                  ...config,
                  defaults: { ...config.defaults, diarize: e.target.checked },
                })
              }
              className="rounded"
            />
            <label htmlFor="diarize" className="text-sm font-medium">
              Speaker Diarization
            </label>
          </div>
        </div>
      </div>

      {/* Generation Config */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold">Generation</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium block mb-1">Primary Provider</label>
            <select
              value={config.generation.primary}
              onChange={(e) =>
                setConfig({
                  ...config,
                  generation: { ...config.generation, primary: e.target.value },
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {GENERATION_PROVIDERS.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Requires provider API key to activate
            </span>
          </div>
        </div>
      </div>

      {/* Storage Config */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold">Storage</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium block mb-1">Primary Provider</label>
            <select
              value={config.storage.primary}
              onChange={(e) =>
                setConfig({
                  ...config,
                  storage: { ...config.storage, primary: e.target.value },
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {STORAGE_PROVIDERS.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Max Duration (sec)</label>
            <input
              type="number"
              value={config.defaults.maxDurationSec}
              onChange={(e) =>
                setConfig({
                  ...config,
                  defaults: {
                    ...config.defaults,
                    maxDurationSec: parseInt(e.target.value) || 600,
                  },
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
