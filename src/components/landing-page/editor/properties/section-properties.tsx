"use client";

import { useState, useCallback } from "react";
import { useLandingPageEditorStore } from "@/stores/landing-page-editor-store";
import { TextProp } from "./prop-editors/text-prop";
import { NumberProp } from "./prop-editors/number-prop";
import { SelectProp } from "./prop-editors/select-prop";
import { ColorProp } from "./prop-editors/color-prop";
import { BooleanProp } from "./prop-editors/boolean-prop";
import { SpacingProp } from "./prop-editors/spacing-prop";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaPickerDialog, type MediaPickerResult } from "../media-picker-dialog";
import { parseYouTubeId, youTubePosterUrl } from "@/lib/landing-page/section-styles";
import { Library, ImageIcon } from "lucide-react";
import type { SectionData, SectionBackground, VideoSettings } from "@/types/landing-page";

interface SectionPropertiesProps {
  section: SectionData;
}

const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  muted: true,
  loop: true,
  autoplay: true,
};

export function SectionProperties({ section }: SectionPropertiesProps) {
  const updateSectionLayout = useLandingPageEditorStore((s) => s.updateSectionLayout);
  const updateSectionName = useLandingPageEditorStore((s) => s.updateSectionName);

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerType, setMediaPickerType] = useState<"image" | "video">("image");

  const bg = section.layout.background;

  const updateBackground = useCallback(
    (partial: Partial<SectionBackground>) => {
      updateSectionLayout(section.id, {
        background: { ...section.layout.background, ...partial },
      });
    },
    [section.id, section.layout.background, updateSectionLayout]
  );

  // Handle background type change — reset fields when switching
  const handleTypeChange = (type: string) => {
    const base: SectionBackground = {
      type: type as SectionBackground["type"],
      value: "",
    };
    if (type === "video") {
      base.videoSettings = { ...DEFAULT_VIDEO_SETTINGS };
    }
    updateSectionLayout(section.id, { background: base });
  };

  // Handle video URL input with auto-detection
  const handleVideoUrlChange = (url: string) => {
    const youtubeId = parseYouTubeId(url);
    if (youtubeId) {
      updateBackground({
        value: url,
        youtubeId,
        videoUrl: undefined,
        posterUrl: youTubePosterUrl(youtubeId),
        videoSettings: bg.videoSettings || { ...DEFAULT_VIDEO_SETTINGS },
      });
    } else {
      updateBackground({
        value: url,
        youtubeId: undefined,
        videoUrl: url || undefined,
        videoSettings: bg.videoSettings || { ...DEFAULT_VIDEO_SETTINGS },
      });
    }
  };

  // Handle media picker selection
  const handleMediaPickerSelect = (result: MediaPickerResult) => {
    if (mediaPickerType === "image") {
      updateSectionLayout(section.id, {
        background: {
          ...section.layout.background,
          type: "image",
          value: result.url,
        },
      });
    } else {
      // Video selected from picker
      const youtubeId = result.youtubeId || undefined;
      updateSectionLayout(section.id, {
        background: {
          type: "video",
          value: result.url,
          youtubeId,
          videoUrl: youtubeId ? undefined : result.url,
          posterUrl:
            result.thumbnailUrl ||
            (youtubeId ? youTubePosterUrl(youtubeId) : undefined),
          videoSettings: bg.videoSettings || { ...DEFAULT_VIDEO_SETTINGS },
          overlay: bg.overlay,
        },
      });
    }
  };

  const updateVideoSetting = (key: keyof VideoSettings, value: boolean) => {
    updateBackground({
      videoSettings: {
        ...(bg.videoSettings || DEFAULT_VIDEO_SETTINGS),
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Section
        </p>
        <TextProp
          label="Name"
          value={section.name || ""}
          onChange={(name) => updateSectionName(section.id, name)}
          placeholder="Section name"
        />
        <SelectProp
          label="Type"
          value={section.sectionType}
          onChange={() => {}}
          disabled
          options={[
            { label: "Custom", value: "custom" },
            { label: "Hero", value: "hero" },
            { label: "Features", value: "features" },
            { label: "CTA", value: "cta" },
            { label: "Testimonials", value: "testimonials" },
            { label: "Footer", value: "footer" },
          ]}
        />
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Layout
        </p>
        <NumberProp
          label="Columns"
          value={section.layout.columns}
          onChange={(columns) => updateSectionLayout(section.id, { columns })}
          min={1}
          max={12}
        />
        <NumberProp
          label="Gap (px)"
          value={section.layout.gap}
          onChange={(gap) => updateSectionLayout(section.id, { gap })}
          min={0}
          max={100}
        />
        <SelectProp
          label="Alignment"
          value={section.layout.alignment}
          onChange={(alignment) =>
            updateSectionLayout(section.id, { alignment: alignment as "left" | "center" | "right" })
          }
          options={[
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ]}
        />
        <SelectProp
          label="Vertical Alignment"
          value={section.layout.verticalAlignment}
          onChange={(verticalAlignment) =>
            updateSectionLayout(section.id, {
              verticalAlignment: verticalAlignment as "top" | "center" | "bottom",
            })
          }
          options={[
            { label: "Top", value: "top" },
            { label: "Center", value: "center" },
            { label: "Bottom", value: "bottom" },
          ]}
        />
        <SpacingProp
          label="Padding"
          value={section.layout.padding}
          onChange={(padding) => updateSectionLayout(section.id, { padding })}
        />
        <NumberProp
          label="Min Height (px)"
          value={section.layout.minHeight || 0}
          onChange={(minHeight) => updateSectionLayout(section.id, { minHeight })}
          min={0}
          max={2000}
        />
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Background
        </p>
        <SelectProp
          label="Type"
          value={bg.type}
          onChange={handleTypeChange}
          options={[
            { label: "None", value: "none" },
            { label: "Color", value: "color" },
            { label: "Gradient", value: "gradient" },
            { label: "Image", value: "image" },
            { label: "Video", value: "video" },
          ]}
        />

        {/* ── Color Background ── */}
        {bg.type === "color" && (
          <ColorProp
            label="Color"
            value={bg.value}
            onChange={(value) => updateBackground({ value })}
          />
        )}

        {/* ── Gradient Background ── */}
        {bg.type === "gradient" && (
          <TextProp
            label="Gradient"
            value={bg.value}
            onChange={(value) => updateBackground({ value })}
            placeholder="linear-gradient(to right, #000, #fff)"
          />
        )}

        {/* ── Image Background ── */}
        {bg.type === "image" && (
          <>
            <TextProp
              label="Image URL"
              value={bg.value}
              onChange={(value) => updateBackground({ value })}
              placeholder="https://..."
            />

            {/* Image preview */}
            {bg.value && (
              <div className="relative w-full h-20 rounded-md overflow-hidden bg-muted border">
                <img
                  src={bg.value}
                  alt="Background preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Browse Library button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setMediaPickerType("image");
                setMediaPickerOpen(true);
              }}
            >
              <Library className="h-3 w-3 mr-1.5" />
              Browse Library
            </Button>

            {/* Overlay */}
            <ColorProp
              label="Overlay"
              value={bg.overlay || ""}
              onChange={(overlay) => updateBackground({ overlay: overlay || undefined })}
            />
          </>
        )}

        {/* ── Video Background ── */}
        {bg.type === "video" && (
          <>
            <TextProp
              label="Video URL"
              value={bg.value}
              onChange={handleVideoUrlChange}
              placeholder="YouTube URL or direct video URL"
            />

            {/* Browse Library button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setMediaPickerType("video");
                setMediaPickerOpen(true);
              }}
            >
              <Library className="h-3 w-3 mr-1.5" />
              Browse Video Library
            </Button>

            {/* Poster preview */}
            {bg.posterUrl && (
              <div className="space-y-1.5">
                <Label className="text-xs">Poster Preview</Label>
                <div className="relative w-full h-20 rounded-md overflow-hidden bg-muted border">
                  <img
                    src={bg.posterUrl}
                    alt="Video poster"
                    className="w-full h-full object-cover"
                  />
                  {bg.youtubeId && (
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
                      YouTube
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Poster URL override */}
            <TextProp
              label="Poster URL"
              value={bg.posterUrl || ""}
              onChange={(posterUrl) => updateBackground({ posterUrl: posterUrl || undefined })}
              placeholder="Auto-generated, or set custom poster"
            />

            {/* Video settings */}
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Playback
              </p>
              <BooleanProp
                label="Muted"
                value={bg.videoSettings?.muted ?? true}
                onChange={(v) => updateVideoSetting("muted", v)}
              />
              <BooleanProp
                label="Loop"
                value={bg.videoSettings?.loop ?? true}
                onChange={(v) => updateVideoSetting("loop", v)}
              />
              <BooleanProp
                label="Autoplay"
                value={bg.videoSettings?.autoplay ?? true}
                onChange={(v) => updateVideoSetting("autoplay", v)}
              />
            </div>

            {/* Overlay */}
            <ColorProp
              label="Overlay"
              value={bg.overlay || ""}
              onChange={(overlay) => updateBackground({ overlay: overlay || undefined })}
            />

            {/* YouTube info note */}
            {bg.youtubeId && (
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                YouTube videos display as poster image backgrounds. Use the Video
                component for playable embeds.
              </p>
            )}
          </>
        )}
      </div>

      {/* Media Picker Dialog */}
      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        mediaType={mediaPickerType}
        onSelect={handleMediaPickerSelect}
      />
    </div>
  );
}
