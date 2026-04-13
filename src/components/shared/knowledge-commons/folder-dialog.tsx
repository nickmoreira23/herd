"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { KnowledgeFolderRow } from "@/lib/knowledge-commons/types";

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  /** If provided, we're editing an existing folder */
  folder?: KnowledgeFolderRow | null;
  /** Parent folder ID for creating subfolders */
  parentId?: string | null;
  /** Folder type for categorizing folders (e.g. "IMAGE", "VIDEO") */
  folderType?: string;
}

const FOLDER_COLORS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#64748b", label: "Slate" },
];

export function FolderDialog({
  open,
  onOpenChange,
  onComplete,
  folder,
  parentId,
  folderType,
}: FolderDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = !!folder;

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setDescription(folder.description ?? "");
      setColor(folder.color);
    } else {
      setName("");
      setDescription("");
      setColor(null);
    }
  }, [folder, open]);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Folder name is required");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || undefined,
        color: color || undefined,
      };

      if (!isEditing && parentId) {
        body.parentId = parentId;
      }

      if (!isEditing && folderType) {
        body.folderType = folderType;
      }

      const url = isEditing
        ? `/api/knowledge/folders/${folder!.id}`
        : "/api/knowledge/folders";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Failed to save folder");
        return;
      }

      toast.success(isEditing ? "Folder updated" : "Folder created");
      onOpenChange(false);
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!saving) onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Folder" : "New Folder"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !saving) handleSave();
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kind of documents go in this folder?"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Color (optional)</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(color === c.value ? null : c.value)}
                  className="w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: c.value,
                    borderColor:
                      color === c.value ? c.value : "transparent",
                    boxShadow:
                      color === c.value
                        ? `0 0 0 2px var(--background), 0 0 0 4px ${c.value}`
                        : "none",
                  }}
                  title={c.label}
                  type="button"
                />
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || !name.trim()} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Folder"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
