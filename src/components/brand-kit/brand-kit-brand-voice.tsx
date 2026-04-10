"use client";

import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { BrandKitSection } from "./brand-kit-section";
import { useBrandKitSection } from "@/hooks/use-brand-kit-section";
import { BRAND_VOICE_KEYS, VOICE_TONE_OPTIONS } from "@/lib/brand-kit-settings";
import { Plus, X } from "lucide-react";

function parseJsonArray(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function BrandKitBrandVoice() {
  const { settings, set, save, saving, loading } =
    useBrandKitSection(BRAND_VOICE_KEYS);

  const setJsonArray = useCallback(
    (key: string, arr: string[]) => {
      set(key, JSON.stringify(arr));
    },
    [set]
  );

  const tones = parseJsonArray(settings.brandVoiceTone);
  const traits = parseJsonArray(settings.brandVoiceTraits);
  const dos = parseJsonArray(settings.brandVoiceDos);
  const donts = parseJsonArray(settings.brandVoiceDonts);
  const samplePhrases = parseJsonArray(settings.brandVoiceSamplePhrases);
  const preferredTerms = parseJsonArray(settings.brandVoicePreferredTerms);
  const avoidTerms = parseJsonArray(settings.brandVoiceAvoidTerms);
  const formality = Number(settings.brandVoiceFormality) || 3;
  const techLevel = Number(settings.brandVoiceTechLevel) || 3;

  return (
    <BrandKitSection
      title="Brand Voice"
      description="Define how your brand communicates — used as a style guide and by AI agents."
      saving={saving}
      loading={loading}
      onSave={save}
    >
      <div className="space-y-6">
        {/* Tone */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Tone</CardTitle>
            <CardDescription>
              Select the overall emotional register of your brand. Choose
              multiple if applicable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {VOICE_TONE_OPTIONS.map((tone) => {
                const active = tones.includes(tone);
                return (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? tones.filter((t) => t !== tone)
                        : [...tones, tone];
                      setJsonArray("brandVoiceTone", next);
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/50"
                    }`}
                  >
                    {tone}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Personality Traits */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Personality Traits</CardTitle>
            <CardDescription>
              3-5 adjective descriptors that define your brand personality (e.g.,
              Bold, Approachable, Confident).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TagInput
              tags={traits}
              onChange={(t) => setJsonArray("brandVoiceTraits", t)}
              placeholder="Add a trait..."
              max={5}
            />
          </CardContent>
        </Card>

        {/* Spectrums */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Formality Level</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Slider
                value={[formality]}
                onValueChange={(v) =>
                  set(
                    "brandVoiceFormality",
                    String(Array.isArray(v) ? v[0] : v)
                  )
                }
                min={1}
                max={5}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Very Casual</span>
                <span>Neutral</span>
                <span>Very Formal</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Technical Level</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Slider
                value={[techLevel]}
                onValueChange={(v) =>
                  set(
                    "brandVoiceTechLevel",
                    String(Array.isArray(v) ? v[0] : v)
                  )
                }
                min={1}
                max={5}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Simple</span>
                <span>Balanced</span>
                <span>Technical</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Do's and Don'ts */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-green-600">
                Do&apos;s
              </CardTitle>
              <CardDescription>
                Guidelines your brand should always follow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagInput
                tags={dos}
                onChange={(d) => setJsonArray("brandVoiceDos", d)}
                placeholder="e.g., Use inclusive language..."
                variant="success"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-red-500">
                Don&apos;ts
              </CardTitle>
              <CardDescription>
                Things your brand should always avoid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagInput
                tags={donts}
                onChange={(d) => setJsonArray("brandVoiceDonts", d)}
                placeholder="e.g., Don't use jargon..."
                variant="destructive"
              />
            </CardContent>
          </Card>
        </div>

        {/* Target Audience */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Target Audience</CardTitle>
            <CardDescription>
              Describe who your brand speaks to. This helps tailor the
              communication style.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={settings.brandVoiceAudience || ""}
              onChange={(e) => set("brandVoiceAudience", e.target.value)}
              placeholder="e.g., Health-conscious adults aged 18-45 who are passionate about fitness and performance supplementation..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Sample Phrases */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Sample Phrases</CardTitle>
            <CardDescription>
              Example taglines, slogans, or copy that captures your brand voice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhraseList
              phrases={samplePhrases}
              onChange={(p) => setJsonArray("brandVoiceSamplePhrases", p)}
            />
          </CardContent>
        </Card>

        {/* Vocabulary */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Preferred Terms</CardTitle>
              <CardDescription>
                Words and phrases your brand prefers to use.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagInput
                tags={preferredTerms}
                onChange={(t) => setJsonArray("brandVoicePreferredTerms", t)}
                placeholder="e.g., community, performance..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Words to Avoid</CardTitle>
              <CardDescription>
                Words and phrases your brand should never use.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagInput
                tags={avoidTerms}
                onChange={(t) => setJsonArray("brandVoiceAvoidTerms", t)}
                placeholder="e.g., cheap, basic..."
                variant="destructive"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </BrandKitSection>
  );
}

// ─── Tag Input ───────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  placeholder,
  max,
  variant,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
  variant?: "default" | "success" | "destructive";
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    if (max && tags.length >= max) return;
    onChange([...tags, trimmed]);
    setInput("");
  };

  const remove = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const badgeVariant =
    variant === "success"
      ? "default"
      : variant === "destructive"
        ? "destructive"
        : "secondary";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant={badgeVariant}
            className="gap-1 pr-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="ml-0.5 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1"
          disabled={max !== undefined && tags.length >= max}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={!input.trim() || (max !== undefined && tags.length >= max)}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

// ─── Phrase List ──────────────────────────────────────────────────────────────

function PhraseList({
  phrases,
  onChange,
}: {
  phrases: string[];
  onChange: (phrases: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onChange([...phrases, trimmed]);
    setInput("");
  };

  const remove = (index: number) => {
    onChange(phrases.filter((_, i) => i !== index));
  };

  const update = (index: number, value: string) => {
    const updated = [...phrases];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {phrases.map((phrase, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
            {i + 1}.
          </span>
          <Input
            value={phrase}
            onChange={(e) => update(i, e.target.value)}
            className="flex-1 text-sm italic"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-muted-foreground hover:text-destructive p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <span className="w-5 shrink-0" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a sample phrase or tagline..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={add}
          disabled={!input.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
