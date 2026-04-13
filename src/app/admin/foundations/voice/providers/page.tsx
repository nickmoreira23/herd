"use client";

import { useState, useEffect } from "react";

interface VoiceConfig {
  stt: { primary: string; fallbacks?: string[] };
  tts: { primary: string; fallbacks?: string[] };
  voiceMode: { primary: string; fallbacks?: string[] };
  defaults: {
    sttModel: string;
    sttLanguage: string;
    diarize: boolean;
    ttsVoiceId?: string;
    ttsOutputFormat: string;
  };
}

const STT_PROVIDERS = [
  { slug: "deepgram", name: "Deepgram", models: ["nova-3", "nova-2", "enhanced", "base"], integrationSlug: "deepgram" },
];

const TTS_PROVIDERS = [
  { slug: "elevenlabs", name: "ElevenLabs", models: ["eleven_multilingual_v2", "eleven_monolingual_v1", "eleven_turbo_v2_5"], integrationSlug: "elevenlabs" },
  { slug: "openai-tts", name: "OpenAI TTS", models: ["tts-1-hd", "tts-1"], integrationSlug: "openai" },
];

const VOICE_MODE_PROVIDERS = [
  { slug: "openai-realtime", name: "OpenAI Realtime", integrationSlug: "openai" },
  { slug: "sesame", name: "Sesame CSM", integrationSlug: "sesame" },
];

// Map integration slugs to check for provider availability
const PROVIDER_INTEGRATION_MAP: Record<string, string> = {
  deepgram: "deepgram",
  elevenlabs: "elevenlabs",
  "openai-tts": "openai",
  "openai-realtime": "openai",
  sesame: "sesame",
};

export default function VoiceProvidersPage() {
  const [config, setConfig] = useState<VoiceConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [connectedIntegrations, setConnectedIntegrations] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch voice config
    fetch("/api/foundation/voice/config")
      .then((r) => r.json())
      .then((json) => setConfig(json.data))
      .catch(() => {});

    // Fetch all integrations to check which are connected
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const connected = new Set<string>();
          for (const integration of json.data) {
            if (integration.status === "CONNECTED") {
              connected.add(integration.slug);
            }
          }
          setConnectedIntegrations(connected);
        }
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/foundation/voice/config", {
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

  const isProviderConnected = (providerSlug: string): boolean => {
    const integrationSlug = PROVIDER_INTEGRATION_MAP[providerSlug];
    if (!integrationSlug) return false;
    return connectedIntegrations.has(integrationSlug);
  };

  if (!config) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Voice Providers</h1>
        <p className="text-muted-foreground">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Voice Providers</h1>
          <p className="text-muted-foreground mt-1">
            Configure which providers handle each voice capability.
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

      {/* STT Config */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold">Speech-to-Text (STT)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium block mb-1">Primary Provider</label>
            <select
              value={config.stt.primary}
              onChange={(e) =>
                setConfig({ ...config, stt: { ...config.stt, primary: e.target.value } })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {STT_PROVIDERS.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Model</label>
            <select
              value={config.defaults.sttModel}
              onChange={(e) =>
                setConfig({
                  ...config,
                  defaults: { ...config.defaults, sttModel: e.target.value },
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {STT_PROVIDERS.find((p) => p.slug === config.stt.primary)?.models.map(
                (m) => (
                  <option key={m} value={m}>{m}</option>
                )
              )}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Language</label>
            <input
              type="text"
              value={config.defaults.sttLanguage}
              onChange={(e) =>
                setConfig({
                  ...config,
                  defaults: { ...config.defaults, sttLanguage: e.target.value },
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

      {/* TTS Config */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold">Text-to-Speech (TTS)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium block mb-1">Primary Provider</label>
            <select
              value={config.tts.primary}
              onChange={(e) =>
                setConfig({ ...config, tts: { ...config.tts, primary: e.target.value } })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {TTS_PROVIDERS.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Output Format</label>
            <select
              value={config.defaults.ttsOutputFormat}
              onChange={(e) =>
                setConfig({
                  ...config,
                  defaults: { ...config.defaults, ttsOutputFormat: e.target.value },
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="ogg">OGG</option>
              <option value="pcm">PCM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Voice Mode Config */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold">Voice Mode (Real-Time)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium block mb-1">Primary Provider</label>
            <select
              value={config.voiceMode.primary}
              onChange={(e) =>
                setConfig({
                  ...config,
                  voiceMode: { ...config.voiceMode, primary: e.target.value },
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {VOICE_MODE_PROVIDERS.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            {isProviderConnected(config.voiceMode.primary) ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Provider API key connected
              </span>
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                Requires provider API key — connect {VOICE_MODE_PROVIDERS.find((p) => p.slug === config.voiceMode.primary)?.integrationSlug || "the provider"} in Integrations
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
