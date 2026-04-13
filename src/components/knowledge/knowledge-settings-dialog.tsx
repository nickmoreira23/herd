"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Image,
  Video,
  Music,
  Table2,
  ClipboardList,
  Link2,
  Rss,
  Plug,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { KNOWLEDGE_BLOCKS_SETTING_KEY } from "@/lib/knowledge-commons/constants";

interface BlockToggle {
  name: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const BLOCKS: BlockToggle[] = [
  { name: "documents", label: "Documents", description: "PDF, DOCX, TXT, and more", icon: FileText },
  { name: "images", label: "Images", description: "PNG, JPG, WebP with AI descriptions", icon: Image },
  { name: "videos", label: "Videos", description: "MP4, MOV with transcription", icon: Video },
  { name: "audios", label: "Audios", description: "MP3, WAV with transcription", icon: Music },
  { name: "tables", label: "Tables", description: "Structured data like Airtable", icon: Table2 },
  { name: "forms", label: "Forms", description: "Custom forms with responses", icon: ClipboardList },
  { name: "links", label: "Links", description: "Web pages with scraping", icon: Link2 },
  { name: "feeds", label: "Feeds", description: "RSS with auto-sync", icon: Rss },
  { name: "apps", label: "Apps", description: "Health wearables and integrations", icon: Plug },
];

interface KnowledgeSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabledBlocks: string[];
  onSave: (blocks: string[]) => void;
}

export function KnowledgeSettingsDialog({
  open,
  onOpenChange,
  enabledBlocks,
  onSave,
}: KnowledgeSettingsDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(enabledBlocks));
  const [saving, setSaving] = useState(false);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const value = Array.from(selected).join(",");
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [KNOWLEDGE_BLOCKS_SETTING_KEY]: value }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSave(Array.from(selected));
      toast.success("Knowledge types updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Reset selection when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelected(new Set(enabledBlocks));
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Knowledge Types</DialogTitle>
          <DialogDescription>
            Choose which content types appear in your knowledge base.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {BLOCKS.map((block) => (
            <div
              key={block.name}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <block.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <Label className="text-sm font-medium cursor-pointer" htmlFor={`kb-${block.name}`}>
                    {block.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{block.description}</p>
                </div>
              </div>
              <Switch
                id={`kb-${block.name}`}
                checked={selected.has(block.name)}
                onCheckedChange={() => toggle(block.name)}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
