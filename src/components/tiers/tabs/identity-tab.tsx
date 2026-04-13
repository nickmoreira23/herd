"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus, Upload, X, Plus, GripVertical } from "lucide-react";
import { InfoTip } from "../info-tip";
import type { TierFormState } from "../tier-detail-client";

interface IdentityTabProps {
  form: TierFormState;
  updateForm: (field: string, value: unknown) => void;
  onBlurSave?: () => void;
}

export function IdentityTab({ form, updateForm }: IdentityTabProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFeature, setNewFeature] = useState("");

  // ── Image upload handlers ──────────────────────────────
  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "tiers");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (res.ok && json.data?.url) {
          updateForm("iconUrl", json.data.url);
        }
      } finally {
        setUploading(false);
      }
    },
    [updateForm]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  // ── Highlight features list handlers ───────────────────
  const addFeature = useCallback(() => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    updateForm("highlightFeatures", [...form.highlightFeatures, trimmed]);
    setNewFeature("");
  }, [newFeature, form.highlightFeatures, updateForm]);

  const removeFeature = useCallback(
    (index: number) => {
      const next = form.highlightFeatures.filter((_, i) => i !== index);
      updateForm("highlightFeatures", next);
    },
    [form.highlightFeatures, updateForm]
  );

  const updateFeature = useCallback(
    (index: number, value: string) => {
      const next = [...form.highlightFeatures];
      next[index] = value;
      updateForm("highlightFeatures", next);
    },
    [form.highlightFeatures, updateForm]
  );

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Name + Slug */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="tier-name">Plan Name <InfoTip text="The display name members will see when browsing available plans." /></Label>
          <Input
            id="tier-name"
            value={form.name}
            onChange={(e) => updateForm("name", e.target.value)}
            placeholder='e.g. "Elite"'
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tier-slug">URL Slug <InfoTip text="URL-friendly identifier used in links (e.g. /plans/starter). Should be lowercase with hyphens." /></Label>
          <Input
            id="tier-slug"
            value={form.slug}
            onChange={(e) => updateForm("slug", e.target.value)}
            placeholder="elite"
            className="font-mono text-xs"
          />
        </div>
      </div>

      {/* Tagline */}
      <div className="space-y-1.5">
        <Label htmlFor="tier-tagline">Tagline <InfoTip text="A short one-liner displayed under the plan name on the pricing page." /></Label>
        <Input
          id="tier-tagline"
          value={form.tagline}
          onChange={(e) => updateForm("tagline", e.target.value)}
          placeholder="Short phrase shown under the plan name"
        />
      </div>

      {/* Visibility + Featured */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Visibility <InfoTip text="Public: visible to everyone. Rep Only: only sales reps can offer. Hidden: not shown on pricing page." /></Label>
          <Select
            value={form.visibility}
            onValueChange={(val) => {
              updateForm("visibility", val ?? "PUBLIC");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="REP_ONLY">Rep Only</SelectItem>
              <SelectItem value="HIDDEN">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Featured <InfoTip text="When enabled, this plan is visually highlighted on the public pricing page." /></Label>
          <div className="flex items-center gap-2 mt-1.5">
            <Switch
              checked={form.isFeatured}
              onCheckedChange={(val) => {
                updateForm("isFeatured", val);
              }}
            />
            <span className="text-sm text-muted-foreground">
              {form.isFeatured ? "Highlighted on pricing page" : "Not featured"}
            </span>
          </div>
        </div>
      </div>

      {/* Plan Image — Drag & Drop Upload */}
      <div className="space-y-1.5">
        <Label>Plan Image <InfoTip text="The main image or icon displayed on the plan card. Upload or paste a URL." /></Label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex items-center gap-4 rounded-xl border-2 border-dashed p-4 cursor-pointer transition-colors
            ${dragOver ? "border-[#C5F135] bg-[#C5F135]/5" : "border-muted-foreground/20 hover:border-muted-foreground/40"}
            ${uploading ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center overflow-hidden shrink-0">
            {form.iconUrl ? (
              <Image
                src={form.iconUrl}
                alt="Image preview"
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {form.iconUrl ? "Replace image" : "Upload plan image"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag and drop an image, or click to browse. PNG, JPG, SVG.
            </p>
          </div>
          {form.iconUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateForm("iconUrl", "");
              }}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {/* Fallback: paste URL */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] text-muted-foreground">or paste URL:</span>
          <Input
            value={form.iconUrl}
            onChange={(e) => updateForm("iconUrl", e.target.value)}
            placeholder="https://example.com/image.png"
            className="flex-1 text-sm"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="tier-desc">Description <InfoTip text="Detailed description shown on the plan's detail page and used in marketing materials." /></Label>
        <Textarea
          id="tier-desc"
          value={form.description}
          onChange={(e) => updateForm("description", e.target.value)}
          rows={3}
          placeholder="Brief description shown to potential subscribers..."
        />
      </div>

      {/* Highlight Features — List with Add/Remove */}
      <div className="space-y-2">
        <Label>Highlight Features <InfoTip text="Key selling points displayed as bullet points on the plan card. These help members compare plans at a glance." /></Label>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Key features displayed on the plan card. Drag to reorder.
        </p>

        {/* Existing features */}
        {form.highlightFeatures.length > 0 && (
          <div className="space-y-1.5">
            {form.highlightFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 group/feature"
              >
                <button
                  className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0"
                  onMouseDown={(e) => e.preventDefault()}
                  title="Drag to reorder"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
                <Input
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                <button
                  onClick={() => removeFeature(index)}
                  className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 opacity-0 group-hover/feature:opacity-100"
                  title="Remove feature"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new feature */}
        <div className="flex items-center gap-2">
          <Input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature();
              }
            }}
            placeholder="Add a feature..."
            className="h-8 text-sm flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3"
            onClick={addFeature}
            disabled={!newFeature.trim()}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
