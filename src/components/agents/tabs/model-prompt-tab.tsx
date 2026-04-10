"use client";

import { useMemo } from "react";
import type { AgentFormState } from "../agent-detail-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, ImageIcon, Video, Mic, Type } from "lucide-react";

interface ModelPromptTabProps {
  form: AgentFormState;
  updateForm: (field: string, value: unknown) => void;
  onBlurSave?: () => void;
}

// ─── Model Type Definitions ─────────────────────────────────────

const MODEL_TYPE_OPTIONS = [
  { value: "TEXT", label: "Text / LLM", icon: Type, description: "Language models for text generation, analysis, and reasoning" },
  { value: "IMAGE", label: "Image", icon: ImageIcon, description: "Image generation and editing models" },
  { value: "VIDEO", label: "Video", icon: Video, description: "Video generation and editing models" },
  { value: "VOICE", label: "Voice", icon: Mic, description: "Text-to-speech and voice synthesis models" },
] as const;

// ─── Providers by Model Type ────────────────────────────────────

const PROVIDERS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  TEXT: [
    { value: "anthropic", label: "Anthropic" },
    { value: "openai", label: "OpenAI" },
    { value: "google", label: "Google" },
    { value: "grok-xai", label: "Grok (xAI)" },
    { value: "mistral", label: "Mistral" },
    { value: "meta", label: "Meta" },
    { value: "cohere", label: "Cohere" },
    { value: "custom", label: "Custom" },
  ],
  IMAGE: [
    { value: "openai", label: "OpenAI" },
    { value: "stability-ai", label: "Stability AI" },
    { value: "google", label: "Google" },
    { value: "replicate", label: "Replicate" },
    { value: "gamma", label: "Gamma" },
    { value: "custom", label: "Custom" },
  ],
  VIDEO: [
    { value: "openai", label: "OpenAI" },
    { value: "runway", label: "Runway" },
    { value: "google", label: "Google" },
    { value: "heygen", label: "HeyGen" },
    { value: "replicate", label: "Replicate" },
    { value: "gamma", label: "Gamma" },
    { value: "custom", label: "Custom" },
  ],
  VOICE: [
    { value: "elevenlabs", label: "ElevenLabs" },
    { value: "openai", label: "OpenAI" },
    { value: "google", label: "Google" },
    { value: "gamma", label: "Gamma" },
    { value: "custom", label: "Custom" },
  ],
};

// ─── Models by Type + Provider ──────────────────────────────────

const MODELS_BY_TYPE_AND_PROVIDER: Record<string, Record<string, { value: string; label: string }[]>> = {
  TEXT: {
    anthropic: [
      { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
    openai: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4.1", label: "GPT-4.1" },
      { value: "o3", label: "o3" },
      { value: "o3-mini", label: "o3 Mini" },
      { value: "o4-mini", label: "o4 Mini" },
    ],
    google: [
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ],
    "grok-xai": [
      { value: "grok-3", label: "Grok 3" },
      { value: "grok-3-mini", label: "Grok 3 Mini" },
    ],
    mistral: [
      { value: "mistral-large-latest", label: "Mistral Large" },
      { value: "mistral-medium-latest", label: "Mistral Medium" },
    ],
    meta: [
      { value: "llama-4-maverick", label: "Llama 4 Maverick" },
      { value: "llama-4-scout", label: "Llama 4 Scout" },
      { value: "llama-3.3-70b", label: "Llama 3.3 70B" },
    ],
    cohere: [
      { value: "command-r-plus", label: "Command R+" },
      { value: "command-r", label: "Command R" },
      { value: "command-a", label: "Command A" },
    ],
  },
  IMAGE: {
    openai: [
      { value: "gpt-image-1", label: "GPT Image 1" },
      { value: "dall-e-3", label: "DALL-E 3" },
      { value: "dall-e-2", label: "DALL-E 2" },
    ],
    "stability-ai": [
      { value: "stable-image-ultra", label: "Stable Image Ultra" },
      { value: "stable-diffusion-3.5-large", label: "SD 3.5 Large" },
      { value: "stable-diffusion-3.5-medium", label: "SD 3.5 Medium" },
    ],
    google: [
      { value: "imagen-3", label: "Imagen 3" },
      { value: "imagen-3-fast", label: "Imagen 3 Fast" },
    ],
    replicate: [
      { value: "flux-1.1-pro", label: "Flux 1.1 Pro" },
      { value: "flux-schnell", label: "Flux Schnell" },
      { value: "flux-dev", label: "Flux Dev" },
    ],
    gamma: [
      { value: "gamma-image-1", label: "Gamma Image 1" },
    ],
  },
  VIDEO: {
    openai: [
      { value: "sora", label: "Sora" },
    ],
    runway: [
      { value: "gen-4", label: "Gen-4" },
      { value: "gen-3-alpha-turbo", label: "Gen-3 Alpha Turbo" },
    ],
    google: [
      { value: "veo-2", label: "Veo 2" },
      { value: "seed-dance-2.0", label: "Seed Dance 2.0" },
    ],
    replicate: [
      { value: "minimax-video-01", label: "MiniMax Video-01" },
      { value: "luma-ray-2", label: "Luma Ray 2" },
    ],
    heygen: [
      { value: "heygen-v5", label: "HeyGen V5 Avatar" },
      { value: "heygen-v4", label: "HeyGen V4 Avatar" },
    ],
    gamma: [
      { value: "gamma-video-1", label: "Gamma Video 1" },
    ],
  },
  VOICE: {
    elevenlabs: [
      { value: "eleven_multilingual_v2", label: "Multilingual v2" },
      { value: "eleven_turbo_v2_5", label: "Turbo v2.5" },
      { value: "eleven_flash_v2_5", label: "Flash v2.5" },
    ],
    openai: [
      { value: "tts-1-hd", label: "TTS-1 HD" },
      { value: "tts-1", label: "TTS-1" },
    ],
    google: [
      { value: "chirp-2", label: "Chirp 2" },
    ],
    gamma: [
      { value: "gamma-voice-1", label: "Gamma Voice 1" },
    ],
  },
};

// ─── Modality-specific options ──────────────────────────────────

const IMAGE_SIZES = ["1024x1024", "1792x1024", "1024x1792", "512x512", "256x256"];
const IMAGE_STYLES = ["natural", "vivid", "anime", "photorealistic", "digital-art"];
const IMAGE_QUALITIES = ["standard", "hd"];

const VIDEO_RESOLUTIONS = ["720p", "1080p", "4K"];
const VIDEO_ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4"];

const TOKEN_PRESETS = [256, 512, 1024, 2048, 4096, 8192];

// ─── Component ──────────────────────────────────────────────────

export function ModelPromptTab({
  form,
  updateForm,
  onBlurSave,
}: ModelPromptTabProps) {
  const modelType = form.modelType || "TEXT";
  const providers = PROVIDERS_BY_TYPE[modelType] || PROVIDERS_BY_TYPE.TEXT;
  const modelsForProvider = useMemo(() => {
    const typeModels = MODELS_BY_TYPE_AND_PROVIDER[modelType];
    if (!typeModels || !form.modelProvider || form.modelProvider === "custom") return [];
    return typeModels[form.modelProvider] || [];
  }, [modelType, form.modelProvider]);

  const isCustomModel =
    form.modelProvider === "custom" ||
    (form.modelId && !modelsForProvider.some((m) => m.value === form.modelId));

  const tempValue = form.temperature ? parseFloat(form.temperature) : 0.7;

  const handleTypeChange = (newType: string) => {
    updateForm("modelType", newType);
    // Reset provider and model when switching types
    const newProviders = PROVIDERS_BY_TYPE[newType] || [];
    const firstProvider = newProviders[0]?.value || "";
    updateForm("modelProvider", firstProvider);
    const newModels = MODELS_BY_TYPE_AND_PROVIDER[newType]?.[firstProvider] || [];
    updateForm("modelId", newModels[0]?.value || "");
    onBlurSave?.();
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Model Type Selector */}
      <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
        <div className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Model Type
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {MODEL_TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = modelType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTypeChange(opt.value)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all text-center ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-card hover:border-muted-foreground/20"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider & Model */}
      <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
        <div className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Model Selection
          </span>
          <Badge variant="outline" className="text-[10px] ml-auto">
            {MODEL_TYPE_OPTIONS.find((o) => o.value === modelType)?.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select
              value={form.modelProvider || undefined}
              onValueChange={(val) => {
                updateForm("modelProvider", val ?? "");
                if (val && val !== "custom") {
                  const models = MODELS_BY_TYPE_AND_PROVIDER[modelType]?.[val] || [];
                  if (models.length) updateForm("modelId", models[0].value);
                  else updateForm("modelId", "");
                }
                onBlurSave?.();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider..." />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Model</Label>
            {isCustomModel || !modelsForProvider.length ? (
              <Input
                value={form.modelId}
                onChange={(e) => updateForm("modelId", e.target.value)}
                onBlur={onBlurSave}
                placeholder={
                  modelType === "IMAGE" ? "e.g. dall-e-3" :
                  modelType === "VIDEO" ? "e.g. gen-4" :
                  modelType === "VOICE" ? "e.g. eleven_multilingual_v2" :
                  "e.g. claude-sonnet-4-20250514"
                }
                className="font-mono text-sm"
              />
            ) : (
              <Select
                value={form.modelId || undefined}
                onValueChange={(val) => {
                  if (val === "__custom__") {
                    updateForm("modelId", "");
                  } else {
                    updateForm("modelId", val);
                  }
                  onBlurSave?.();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>
                      {providers.find((p) => p.value === form.modelProvider)?.label}
                    </SelectLabel>
                    {modelsForProvider.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectItem value="__custom__">Custom...</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Text model settings: temperature, max tokens, response format */}
        {modelType === "TEXT" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Temperature</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {tempValue.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[tempValue]}
                  onValueChange={(val) => {
                    const v = Array.isArray(val) ? val[0] : val;
                    updateForm("temperature", v.toFixed(2));
                  }}
                  onValueCommitted={() => onBlurSave?.()}
                  min={0}
                  max={2}
                  step={0.01}
                />
                <p className="text-[10px] text-muted-foreground">
                  Lower = more deterministic, Higher = more creative
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={form.maxTokens}
                  onChange={(e) => updateForm("maxTokens", e.target.value)}
                  onBlur={onBlurSave}
                  placeholder="4096"
                />
                <div className="flex gap-1 flex-wrap">
                  {TOKEN_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      variant="outline"
                      size="sm"
                      className="h-5 px-1.5 text-[10px]"
                      onClick={() => {
                        updateForm("maxTokens", String(preset));
                        onBlurSave?.();
                      }}
                    >
                      {preset >= 1024 ? `${preset / 1024}k` : preset}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Response Format</Label>
              <Select
                value={form.responseFormat || "text"}
                onValueChange={(val) => {
                  updateForm("responseFormat", val === "text" ? "" : val);
                  onBlurSave?.();
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text (default)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="structured">Structured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Image model settings */}
        {modelType === "IMAGE" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Image Size</Label>
              <Select
                value={form.imageSize || "1024x1024"}
                onValueChange={(val) => {
                  updateForm("imageSize", val);
                  onBlurSave?.();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Style</Label>
              <Select
                value={form.imageStyle || "natural"}
                onValueChange={(val) => {
                  updateForm("imageStyle", val);
                  onBlurSave?.();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_STYLES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Quality</Label>
              <Select
                value={form.imageQuality || "standard"}
                onValueChange={(val) => {
                  updateForm("imageQuality", val);
                  onBlurSave?.();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_QUALITIES.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q.charAt(0).toUpperCase() + q.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Video model settings */}
        {modelType === "VIDEO" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Max Duration (seconds)</Label>
              <Input
                type="number"
                value={form.videoDuration}
                onChange={(e) => updateForm("videoDuration", e.target.value)}
                onBlur={onBlurSave}
                placeholder="10"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Resolution</Label>
              <Select
                value={form.videoResolution || "1080p"}
                onValueChange={(val) => {
                  updateForm("videoResolution", val);
                  onBlurSave?.();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_RESOLUTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Aspect Ratio</Label>
              <Select
                value={form.videoAspectRatio || "16:9"}
                onValueChange={(val) => {
                  updateForm("videoAspectRatio", val);
                  onBlurSave?.();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_ASPECT_RATIOS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Voice model settings */}
        {modelType === "VOICE" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Voice ID</Label>
              <Input
                value={form.voiceId}
                onChange={(e) => updateForm("voiceId", e.target.value)}
                onBlur={onBlurSave}
                placeholder="Provider-specific voice identifier (e.g. rachel, alloy)"
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Enter the voice ID from your provider. Check their docs for available voices.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Speed</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {form.voiceSpeed ? parseFloat(form.voiceSpeed).toFixed(2) : "1.00"}x
                  </span>
                </div>
                <Slider
                  value={[form.voiceSpeed ? parseFloat(form.voiceSpeed) : 1.0]}
                  onValueChange={(val) => {
                    const v = Array.isArray(val) ? val[0] : val;
                    updateForm("voiceSpeed", v.toFixed(2));
                  }}
                  onValueCommitted={() => onBlurSave?.()}
                  min={0.25}
                  max={4.0}
                  step={0.05}
                />
                <p className="text-[10px] text-muted-foreground">
                  0.25x (slow) to 4.0x (fast)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Stability</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {form.voiceStability ? parseFloat(form.voiceStability).toFixed(2) : "0.50"}
                  </span>
                </div>
                <Slider
                  value={[form.voiceStability ? parseFloat(form.voiceStability) : 0.5]}
                  onValueChange={(val) => {
                    const v = Array.isArray(val) ? val[0] : val;
                    updateForm("voiceStability", v.toFixed(2));
                  }}
                  onValueCommitted={() => onBlurSave?.()}
                  min={0}
                  max={1}
                  step={0.01}
                />
                <p className="text-[10px] text-muted-foreground">
                  Lower = more expressive, Higher = more consistent
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Prompt — shown for all types but with type-specific guidance */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="system-prompt">
            {modelType === "IMAGE" ? "Image Prompt Template" :
             modelType === "VIDEO" ? "Video Prompt Template" :
             modelType === "VOICE" ? "Voice Instructions" :
             "System Prompt"}
          </Label>
          <span className="text-[10px] text-muted-foreground">
            {form.systemPrompt.length} chars
          </span>
        </div>
        <Textarea
          id="system-prompt"
          value={form.systemPrompt}
          onChange={(e) => updateForm("systemPrompt", e.target.value)}
          onBlur={onBlurSave}
          placeholder={
            modelType === "IMAGE"
              ? "A {style} image of {subject}, high quality, detailed..."
              : modelType === "VIDEO"
              ? "Generate a {duration}s video showing {scene}, cinematic quality..."
              : modelType === "VOICE"
              ? "Speak in a warm, professional tone. Emphasize key points..."
              : "You are a fitness AI assistant that specializes in..."
          }
          className="min-h-[400px] font-mono text-sm leading-relaxed"
        />
        <p className="text-[10px] text-muted-foreground">
          {modelType === "IMAGE"
            ? "Template for image generation prompts. Use {placeholders} for dynamic values."
            : modelType === "VIDEO"
            ? "Template for video generation prompts. Use {placeholders} for dynamic values."
            : modelType === "VOICE"
            ? "Instructions for voice synthesis style and behavior."
            : "Base system prompt for this agent. Skills can append additional context when active."}
        </p>
      </div>
    </div>
  );
}
