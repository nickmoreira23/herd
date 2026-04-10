"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import type { AgentFormState } from "../agent-detail-client";
import { AGENT_CATEGORIES } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPicker, DynamicIcon } from "@/components/shared/icon-picker";
import { toast } from "sonner";

interface OverviewTabProps {
  form: AgentFormState;
  updateForm: (field: string, value: unknown) => void;
  onBlurSave?: () => void;
  isNew?: boolean;
  agentId?: string;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const CATEGORY_COLORS: Record<string, string> = {
  NUTRITION: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
  TRAINING: "border-orange-400/50 bg-orange-400/10 text-orange-400",
  RECOVERY: "border-purple-400/50 bg-purple-400/10 text-purple-400",
  COACHING: "border-cyan-400/50 bg-cyan-400/10 text-cyan-400",
  ANALYTICS: "border-pink-400/50 bg-pink-400/10 text-pink-400",
  IMAGE_GENERATION: "border-indigo-400/50 bg-indigo-400/10 text-indigo-400",
  VIDEO_GENERATION: "border-rose-400/50 bg-rose-400/10 text-rose-400",
  VOICE: "border-amber-400/50 bg-amber-400/10 text-amber-400",
  MULTIMODAL: "border-violet-400/50 bg-violet-400/10 text-violet-400",
};

export function OverviewTab({
  form,
  updateForm,
  onBlurSave,
  isNew,
  agentId,
}: OverviewTabProps) {
  const [autoKey, setAutoKey] = useState(isNew ?? false);

  const handleIconUpload = useCallback(
    async (file: File) => {
      if (!agentId) {
        toast.error("Save the agent first before uploading an icon");
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`/api/agents/${agentId}/avatar`, {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (res.ok && json.data?.iconUrl) {
          updateForm("iconUrl", json.data.iconUrl);
          toast.success("Icon uploaded");
        } else {
          toast.error(json.error || "Upload failed");
        }
      } catch {
        toast.error("Upload failed");
      }
    },
    [agentId, updateForm]
  );

  const handleRemoveUpload = useCallback(async () => {
    if (!agentId) return;
    try {
      const res = await fetch(`/api/agents/${agentId}/avatar`, {
        method: "DELETE",
      });
      if (res.ok) {
        updateForm("iconUrl", "");
        toast.success("Custom icon removed");
      }
    } catch {
      toast.error("Failed to remove icon");
    }
  }, [agentId, updateForm]);

  return (
    <div className="grid grid-cols-[1fr,320px] gap-8 max-w-5xl">
      {/* Left: form fields */}
      <div className="space-y-5">
        {/* Icon + Name row */}
        <div className="flex items-start gap-4">
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <IconPicker
              value={form.icon}
              onChange={(iconName) => {
                updateForm("icon", iconName);
                onBlurSave?.();
              }}
              iconUrl={form.iconUrl || null}
              onUpload={agentId ? handleIconUpload : undefined}
              onRemoveUpload={form.iconUrl ? handleRemoveUpload : undefined}
            />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                value={form.name}
                onChange={(e) => {
                  updateForm("name", e.target.value);
                  if (autoKey) updateForm("key", toSlug(e.target.value));
                }}
                onBlur={onBlurSave}
                placeholder="Meal Plan Generator"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agent-key">Key (slug)</Label>
              <Input
                id="agent-key"
                value={form.key}
                onChange={(e) => {
                  setAutoKey(false);
                  updateForm("key", e.target.value);
                }}
                onBlur={onBlurSave}
                placeholder="meal_plan"
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="agent-description">Description</Label>
          <Textarea
            id="agent-description"
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
            onBlur={onBlurSave}
            placeholder="Short public-facing description..."
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="agent-long-desc">Detailed Description</Label>
          <Textarea
            id="agent-long-desc"
            value={form.longDescription}
            onChange={(e) => updateForm("longDescription", e.target.value)}
            onBlur={onBlurSave}
            placeholder="Detailed capability notes for admin reference..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(val) => {
                updateForm("category", val);
                onBlurSave?.();
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agent-sort">Sort Order</Label>
            <Input
              id="agent-sort"
              type="number"
              value={form.sortOrder}
              onChange={(e) => updateForm("sortOrder", e.target.value)}
              onBlur={onBlurSave}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agent-version">Version</Label>
            <Input
              id="agent-version"
              value={form.version}
              onChange={(e) => updateForm("version", e.target.value)}
              onBlur={onBlurSave}
              placeholder="1.0"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="agent-tags">Tags (comma-separated)</Label>
          <Input
            id="agent-tags"
            value={form.tags}
            onChange={(e) => updateForm("tags", e.target.value)}
            onBlur={onBlurSave}
            placeholder="fitness, nutrition, meal-prep"
          />
        </div>
      </div>

      {/* Right: preview card */}
      <div className="sticky top-6">
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {form.iconUrl ? (
                <Image
                  src={form.iconUrl}
                  alt="Agent icon"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                <DynamicIcon
                  name={form.icon}
                  className="h-5 w-5 text-muted-foreground"
                />
              )}
            </div>
            <div>
              <p className="font-semibold text-sm">
                {form.name || "Agent Name"}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {form.key || "agent_key"}
              </p>
            </div>
          </div>

          {form.category && (
            <Badge
              variant="outline"
              className={`text-[10px] ${CATEGORY_COLORS[form.category] || ""}`}
            >
              {form.category}
            </Badge>
          )}

          {form.description && (
            <p className="text-xs text-muted-foreground">
              {form.description}
            </p>
          )}

          {form.tags && (
            <div className="flex flex-wrap gap-1">
              {form.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px] font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
            </div>
          )}

          <div className="text-[11px] text-muted-foreground space-y-1 pt-2 border-t">
            <div className="flex justify-between">
              <span>Version</span>
              <span>{form.version || "1.0"}</span>
            </div>
            <div className="flex justify-between">
              <span>Sort Order</span>
              <span>{form.sortOrder || "0"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
