"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "sonner";
import {
  Bot,
  ArrowLeft,
  Save,
  Power,
  Mic,
  Video,
  Filter,
  Sparkles,
  Bell,
  Settings,
  Loader2,
  CheckCircle2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface AgentConfig {
  id: string;
  isEnabled: boolean;
  botName: string;
  autoJoin: boolean;
  joinMinutesBefore: number;
  recordingMode: string;
  autoTranscribe: boolean;
  autoSummarize: boolean;
  autoExtractActions: boolean;
  joinAllMeetings: boolean;
  includePlatforms: string[];
  excludeKeywords: string[];
  includeKeywords: string[];
  minimumAttendees: number;
  generateNextSteps: boolean;
  generateSuggestions: boolean;
  notifyOnCompletion: boolean;
}

// ─── Toggle Component ───────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="text-sm">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-violet-500" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Keyword Input Component ────────────────────────────────────

function KeywordInput({
  keywords,
  onChange,
  placeholder,
}: {
  keywords: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const addKeyword = () => {
    const trimmed = input.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      onChange([...keywords, trimmed]);
    }
    setInput("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addKeyword();
            }
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={addKeyword}
          disabled={!input.trim()}
        >
          Add
        </Button>
      </div>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <Badge
              key={kw}
              variant="outline"
              className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => onChange(keywords.filter((k) => k !== kw))}
            >
              {kw} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function MeetingAgentSettings() {
  const router = useRouter();
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/meetings/agent-config")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.config) setConfig(json.data.config);
      })
      .catch(() => toast.error("Failed to load agent settings"));
  }, []);

  const updateField = useCallback(
    <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
      setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
      setDirty(true);
    },
    []
  );

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const { id, ...data } = config;
      const res = await fetch("/api/meetings/agent-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Agent settings saved");
      setDirty(false);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading State ────────────────────────────────────────────

  if (!config) {
    return (
      <>
        <PageHeader
          title="Meeting Agent Settings"
          description="Configure your AI meeting agent"
        />
        <div className="px-4 space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  // ─── Loaded State ─────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title="Meeting Agent Settings"
        description="Configure how your AI agent joins, records, and processes meetings"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/blocks/meetings")}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !dirty}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="px-4 space-y-6 pb-10">
        {/* Status Card */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    config.isEnabled ? "bg-violet-500/10" : "bg-muted"
                  }`}
                >
                  <Bot
                    className={`h-5 w-5 ${
                      config.isEnabled ? "text-violet-500" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Meeting Agent</p>
                  <p className="text-xs text-muted-foreground">
                    {config.isEnabled
                      ? "Active — automatically joining and recording meetings"
                      : "Disabled — no meetings will be recorded automatically"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    config.isEnabled
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {config.isEnabled ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    "Disabled"
                  )}
                </Badge>
                <Toggle
                  checked={config.isEnabled}
                  onChange={(v) => updateField("isEnabled", v)}
                  label=""
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bot Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Bot Configuration
            </CardTitle>
            <CardDescription>
              How the recording bot appears and behaves in meetings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Bot Name</Label>
                <Input
                  value={config.botName}
                  onChange={(e) => updateField("botName", e.target.value)}
                  placeholder="HERD Notetaker"
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  The name shown when the bot joins a meeting
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Join Timing</Label>
                <Select
                  value={String(config.joinMinutesBefore)}
                  onValueChange={(v) => updateField("joinMinutesBefore", Number(v))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">At meeting start</SelectItem>
                    <SelectItem value="1">1 minute before</SelectItem>
                    <SelectItem value="2">2 minutes before</SelectItem>
                    <SelectItem value="5">5 minutes before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Recording Mode</Label>
                <Select
                  value={config.recordingMode}
                  onValueChange={(v) => updateField("recordingMode", v)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audio_only">Audio Only</SelectItem>
                    <SelectItem value="speaker_view">Speaker View</SelectItem>
                    <SelectItem value="gallery_view">Gallery View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <Toggle
                checked={config.autoJoin}
                onChange={(v) => updateField("autoJoin", v)}
                label="Auto-Join Meetings"
                description="Automatically deploy the recording bot to upcoming meetings"
              />
            </div>
          </CardContent>
        </Card>

        {/* Meeting Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Meeting Filters
            </CardTitle>
            <CardDescription>
              Control which meetings the agent should join
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              checked={config.joinAllMeetings}
              onChange={(v) => updateField("joinAllMeetings", v)}
              label="Join All Online Meetings"
              description="When enabled, the agent joins every online meeting on your calendar"
            />

            <div className="space-y-1.5">
              <Label className="text-sm">Platforms</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Leave empty to join meetings on all platforms
              </p>
              <div className="flex flex-wrap gap-2">
                {["GOOGLE_MEET", "ZOOM", "MICROSOFT_TEAMS"].map((platform) => {
                  const isSelected = config.includePlatforms.includes(platform);
                  const labels: Record<string, string> = {
                    GOOGLE_MEET: "Google Meet",
                    ZOOM: "Zoom",
                    MICROSOFT_TEAMS: "Teams",
                  };
                  return (
                    <button
                      key={platform}
                      onClick={() => {
                        const updated = isSelected
                          ? config.includePlatforms.filter((p) => p !== platform)
                          : [...config.includePlatforms, platform];
                        updateField("includePlatforms", updated);
                      }}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-violet-500/10 text-violet-600 border-violet-500/30"
                          : "text-muted-foreground hover:border-foreground/20"
                      }`}
                    >
                      <Video className="h-3 w-3" />
                      {labels[platform]}
                      {isSelected && <CheckCircle2 className="h-3 w-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Minimum Attendees</Label>
              <Select
                value={String(config.minimumAttendees)}
                onValueChange={(v) => updateField("minimumAttendees", Number(v))}
              >
                <SelectTrigger className="text-sm w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No minimum</SelectItem>
                  <SelectItem value="2">2+ attendees</SelectItem>
                  <SelectItem value="3">3+ attendees (skip 1-on-1s)</SelectItem>
                  <SelectItem value="5">5+ attendees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Exclude Keywords</Label>
              <p className="text-xs text-muted-foreground mb-1">
                Skip meetings whose title contains any of these words
              </p>
              <KeywordInput
                keywords={config.excludeKeywords}
                onChange={(v) => updateField("excludeKeywords", v)}
                placeholder="e.g. lunch, personal, blocked"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Include Keywords</Label>
              <p className="text-xs text-muted-foreground mb-1">
                Only join meetings containing these words (leave empty for all)
              </p>
              <KeywordInput
                keywords={config.includeKeywords}
                onChange={(v) => updateField("includeKeywords", v)}
                placeholder="e.g. standup, sprint, review"
              />
            </div>
          </CardContent>
        </Card>

        {/* Processing Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Processing Pipeline
            </CardTitle>
            <CardDescription>
              What happens after a meeting is recorded
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Toggle
              checked={config.autoTranscribe}
              onChange={(v) => updateField("autoTranscribe", v)}
              label="Auto-Transcribe"
              description="Automatically transcribe recordings with speaker diarization"
            />
            <Toggle
              checked={config.autoSummarize}
              onChange={(v) => updateField("autoSummarize", v)}
              label="Auto-Summarize"
              description="Generate AI-powered meeting summaries and extract action items"
            />
            <Toggle
              checked={config.autoExtractActions}
              onChange={(v) => updateField("autoExtractActions", v)}
              label="Extract Action Items"
              description="Identify tasks, assignments, and deadlines from the discussion"
            />
          </CardContent>
        </Card>

        {/* AI Outputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Additional AI-generated outputs from meeting content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Toggle
              checked={config.generateNextSteps}
              onChange={(v) => updateField("generateNextSteps", v)}
              label="Generate Next Steps"
              description="AI-suggested follow-up actions and strategic recommendations"
            />
            <Toggle
              checked={config.generateSuggestions}
              onChange={(v) => updateField("generateSuggestions", v)}
              label="Generate Suggestions"
              description="Strategic observations like unresolved topics, risks, and opportunities"
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Toggle
              checked={config.notifyOnCompletion}
              onChange={(v) => updateField("notifyOnCompletion", v)}
              label="Notify on Completion"
              description="Get notified when a recording is processed and ready to review"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
