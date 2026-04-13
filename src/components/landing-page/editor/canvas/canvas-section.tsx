"use client";

import { useState, useCallback, useRef } from "react";
import { GripVertical, Eye, EyeOff, Lock, Unlock, Copy, Trash2, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLandingPageEditorStore } from "@/stores/landing-page-editor-store";
import { CanvasComponent } from "./canvas-component";
import { sectionBackgroundStyles, alignmentToFlex } from "@/lib/landing-page/section-styles";
import { VideoBackground } from "../../shared/video-background";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import type { SectionData } from "@/types/landing-page";

interface CanvasSectionProps {
  section: SectionData;
}

export function CanvasSection({ section }: CanvasSectionProps) {
  const selectedSectionId = useLandingPageEditorStore((s) => s.selectedSectionId);
  const selectSection = useLandingPageEditorStore((s) => s.selectSection);
  const toggleSectionVisibility = useLandingPageEditorStore((s) => s.toggleSectionVisibility);
  const toggleSectionLock = useLandingPageEditorStore((s) => s.toggleSectionLock);
  const duplicateSection = useLandingPageEditorStore((s) => s.duplicateSection);
  const removeSection = useLandingPageEditorStore((s) => s.removeSection);
  const updateSectionLayout = useLandingPageEditorStore((s) => s.updateSectionLayout);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const isSelected = selectedSectionId === section.id;

  // ── Drag-and-drop image background ──
  const [isDragOverForBg, setIsDragOverForBg] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dragCountRef = useRef(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Only accept file drops that contain images
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCountRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOverForBg(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCountRef.current--;
    if (dragCountRef.current === 0) {
      setIsDragOverForBg(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCountRef.current = 0;
      setIsDragOverForBg(false);

      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith("image/")) {
        toast.error("Only image files can be dropped as backgrounds");
        return;
      }

      setIsUploading(true);
      try {
        // Step 1: Upload file
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/images/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => null);
          throw new Error(err?.error || "Upload failed");
        }
        const uploadJson = await uploadRes.json();

        // Step 2: Create KB record
        const name = file.name.replace(/\.[^/.]+$/, "");
        const imageRes = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            fileType: uploadJson.data.fileType,
            fileName: uploadJson.data.fileName,
            fileUrl: uploadJson.data.fileUrl,
            fileSize: uploadJson.data.fileSize,
            mimeType: uploadJson.data.mimeType,
            width: uploadJson.data.width,
            height: uploadJson.data.height,
          }),
        });
        if (!imageRes.ok) throw new Error("Failed to save image");
        const imageJson = await imageRes.json();

        // Step 3: Fire-and-forget processing
        fetch(`/api/images/${imageJson.data.id}/process`, {
          method: "POST",
        }).catch(() => {});

        // Step 4: Set as section background
        updateSectionLayout(section.id, {
          background: {
            type: "image",
            value: uploadJson.data.fileUrl,
          },
        });

        toast.success("Image set as section background");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    },
    [section.id, updateSectionLayout]
  );

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      {...attributes}
      className={cn(
        "group relative border-y -mb-px cursor-pointer transition-colors",
        isSelected
          ? "border-blue-500 ring-1 ring-blue-500/20"
          : "border-transparent hover:border-muted-foreground/20"
      )}
      onClick={(e) => {
        e.stopPropagation();
        selectSection(section.id);
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop overlay for image background */}
      {isDragOverForBg && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/10 border-2 border-dashed border-blue-500 rounded pointer-events-none"
        >
          <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-lg">
            <ImageIcon className="h-3.5 w-3.5" />
            Drop to set as background
          </div>
        </div>
      )}

      {/* Upload spinner overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 pointer-events-none">
          <div className="flex items-center gap-2 bg-background text-foreground px-3 py-1.5 rounded-md text-xs font-medium shadow-lg border">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading...
          </div>
        </div>
      )}

      {/* Section header bar */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs transition-opacity",
          isSelected ? "opacity-100 bg-blue-500/5" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <button
          type="button"
          className="touch-none"
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
        </button>
        <span className="font-medium text-muted-foreground truncate flex-1">
          {section.name || section.sectionType}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-5 w-5"
          onClick={(e) => {
            e.stopPropagation();
            toggleSectionVisibility(section.id);
          }}
          title={section.isVisible ? "Hide section" : "Show section"}
        >
          {section.isVisible ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-5 w-5"
          onClick={(e) => {
            e.stopPropagation();
            toggleSectionLock(section.id);
          }}
          title={section.isLocked ? "Unlock section" : "Lock section"}
        >
          {section.isLocked ? (
            <Lock className="h-3 w-3" />
          ) : (
            <Unlock className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-5 w-5"
          onClick={(e) => {
            e.stopPropagation();
            duplicateSection(section.id);
          }}
          title="Duplicate section"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-5 w-5 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            removeSection(section.id);
          }}
          title="Delete section"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Section content area */}
      <div
        className={cn(
          "min-h-[120px] relative",
          !section.isVisible && "opacity-40"
        )}
        style={{
          ...sectionBackgroundStyles(section.layout.background),
          position:
            section.layout.background.type === "image" ||
            section.layout.background.type === "video"
              ? "relative"
              : undefined,
        }}
      >
        {/* Video background layer */}
        {section.layout.background.type === "video" && (
          <VideoBackground background={section.layout.background} isEditor />
        )}

        {/* Overlay for image/video backgrounds */}
        {(section.layout.background.type === "image" ||
          section.layout.background.type === "video") &&
          section.layout.background.overlay && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: section.layout.background.overlay,
                zIndex: 1,
              }}
            />
          )}
        <div
          style={{
            paddingTop: section.layout.padding.top,
            paddingRight: section.layout.padding.right,
            paddingBottom: section.layout.padding.bottom,
            paddingLeft: section.layout.padding.left,
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: alignmentToFlex(section.layout.alignment),
            justifyContent: alignmentToFlex(section.layout.verticalAlignment),
            minHeight: section.layout.minHeight ? `${section.layout.minHeight}px` : undefined,
            gap: `${section.layout.gap}px`,
            maxWidth: section.layout.maxWidth === "full"
              ? "100%"
              : section.layout.maxWidth === "container"
                ? "1200px"
                : section.layout.maxWidth
                  ? `${section.layout.maxWidth}px`
                  : undefined,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {section.components.length === 0 ? (
            <div className="flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg py-12 w-full">
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Empty section
                </p>
                <p className="text-xs text-muted-foreground">
                  Add components from the left panel
                </p>
              </div>
            </div>
          ) : (
            section.components.map((component) => (
              <CanvasComponent
                key={component.id}
                node={component}
                sectionId={section.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
