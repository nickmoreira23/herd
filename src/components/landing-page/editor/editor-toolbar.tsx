"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Eye,
  Globe,
  Undo2,
  Redo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLandingPageEditorStore } from "@/stores/landing-page-editor-store";
import { PerformancePanel } from "./performance-panel";

export function EditorToolbar() {
  const router = useRouter();
  const page = useLandingPageEditorStore((s) => s.page);
  const sections = useLandingPageEditorStore((s) => s.sections);
  const pageStyles = useLandingPageEditorStore((s) => s.pageStyles);
  const isDirty = useLandingPageEditorStore((s) => s.isDirty);
  const isSaving = useLandingPageEditorStore((s) => s.isSaving);
  const setSaving = useLandingPageEditorStore((s) => s.setSaving);
  const setDirty = useLandingPageEditorStore((s) => s.setDirty);
  const previewMode = useLandingPageEditorStore((s) => s.previewMode);
  const setPreviewMode = useLandingPageEditorStore((s) => s.setPreviewMode);
  const undo = useLandingPageEditorStore((s) => s.undo);
  const redo = useLandingPageEditorStore((s) => s.redo);
  const canUndo = useLandingPageEditorStore((s) => s.canUndo);
  const canRedo = useLandingPageEditorStore((s) => s.canRedo);

  const [pageName, setPageName] = useState(page?.name ?? "");

  useEffect(() => {
    if (page?.name) setPageName(page.name);
  }, [page?.name]);

  const handleSave = useCallback(async () => {
    if (!page) return;
    setSaving(true);
    try {
      // Save page metadata + styles
      const pageRes = await fetch(`/api/landing-pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pageName,
          pageStyles,
        }),
      });
      if (!pageRes.ok) throw new Error("Failed to save page");

      // Save sections via bulk sync endpoint
      const sectionsRes = await fetch(`/api/landing-pages/${page.id}/sections/sync`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: sections.map((s, i) => ({
            id: s.id,
            sectionType: s.sectionType,
            name: s.name,
            layout: s.layout,
            components: s.components,
            isVisible: s.isVisible,
            isLocked: s.isLocked,
            sortOrder: i,
          })),
        }),
      });
      if (!sectionsRes.ok) throw new Error("Failed to save sections");

      setDirty(false);
      toast.success("Saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [page, pageName, pageStyles, sections, setSaving, setDirty]);

  // Cmd+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, undo, redo]);

  const [isPublishing, setIsPublishing] = useState(false);
  const updatePage = useLandingPageEditorStore((s) => s.updatePage);

  const handlePublish = useCallback(async () => {
    if (!page) return;
    setIsPublishing(true);
    try {
      // Save first if dirty
      if (isDirty) await handleSave();

      const res = await fetch(`/api/landing-pages/${page.id}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to publish");
      const { data } = await res.json();

      // Update local store with new status
      updatePage({
        status: "PUBLISHED",
        publishedVersionId: data.publishedVersionId,
        lastPublishedAt: data.lastPublishedAt,
      });

      toast.success("Published!", {
        description: `Live at /p/${data.slug}`,
        action: {
          label: "View",
          onClick: () => window.open(`/p/${data.slug}`, "_blank"),
        },
      });
    } catch {
      toast.error("Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  }, [page, isDirty, handleSave, updatePage]);

  const statusLabel = page?.status === "PUBLISHED" ? "Published" : "Draft";
  const statusVariant = page?.status === "PUBLISHED" ? "default" : "secondary";

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-3 gap-2">
      {/* Left: back + name */}
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/admin/blocks?tab=pages")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <input
          value={pageName}
          onChange={(e) => {
            setPageName(e.target.value);
            setDirty(true);
          }}
          className="text-sm font-medium bg-transparent border-none outline-none truncate max-w-[200px] focus:ring-1 focus:ring-ring rounded px-1"
        />
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>

      {/* Center: responsive + undo/redo */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <div className="mx-2 h-4 w-px bg-border" />
        <Button
          variant={previewMode === "desktop" ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => setPreviewMode("desktop")}
          title="Desktop"
        >
          <Monitor className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={previewMode === "tablet" ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => setPreviewMode("tablet")}
          title="Tablet"
        >
          <Tablet className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={previewMode === "mobile" ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => setPreviewMode("mobile")}
          title="Mobile"
        >
          <Smartphone className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Right: perf + preview + save + publish */}
      <div className="flex items-center gap-2">
        <PerformancePanel />
        <Button
          variant="ghost"
          size="icon-sm"
          title="Preview"
          disabled
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="relative"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {isSaving ? "Saving..." : "Save"}
          {isDirty && !isSaving && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </Button>
        <Button
          size="sm"
          onClick={handlePublish}
          disabled={isPublishing}
        >
          <Globe className="h-3.5 w-3.5 mr-1.5" />
          {isPublishing ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </div>
  );
}
