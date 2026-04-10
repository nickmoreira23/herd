"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { KnowledgeFormRow } from "./types";

interface KnowledgeFormSettingsProps {
  form: KnowledgeFormRow;
  onUpdate: (updated: KnowledgeFormRow) => void;
}

export function KnowledgeFormSettings({
  form,
  onUpdate,
}: KnowledgeFormSettingsProps) {
  const [name, setName] = useState(form.name);
  const [description, setDescription] = useState(form.description || "");
  const [thankYouMessage, setThankYouMessage] = useState(
    form.thankYouMessage || ""
  );
  const [accessMode, setAccessMode] = useState(form.accessMode);
  const [accessPassword, setAccessPassword] = useState("");
  const [maxResponses, setMaxResponses] = useState(
    form.maxResponses?.toString() || ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || undefined,
        thankYouMessage: thankYouMessage.trim() || undefined,
        accessMode,
      };

      if (accessMode === "PRIVATE" && accessPassword) {
        payload.accessPassword = accessPassword;
      }

      if (maxResponses) {
        payload.maxResponses = parseInt(maxResponses, 10);
      }

      const res = await fetch(`/api/knowledge/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        toast.success("Settings saved");
        onUpdate({ ...form, ...json.data });
      } else {
        toast.error("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs">Form Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Describe what this form is for"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Thank You Message</Label>
        <Textarea
          value={thankYouMessage}
          onChange={(e) => setThankYouMessage(e.target.value)}
          rows={2}
          placeholder="Shown after the form is submitted"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Access Mode</Label>
        <Select value={accessMode} onValueChange={(v) => setAccessMode(v ?? "PUBLIC")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">Public (anyone with the link)</SelectItem>
            <SelectItem value="PRIVATE">Private (password required)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {accessMode === "PRIVATE" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Access Password</Label>
          <Input
            type="password"
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            placeholder="Enter a password for form access"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Max Responses (optional)</Label>
        <Input
          type="number"
          value={maxResponses}
          onChange={(e) => setMaxResponses(e.target.value)}
          placeholder="Leave empty for unlimited"
          min={1}
        />
      </div>

      {form.formStatus === "ACTIVE" && (
        <div className="rounded-lg border bg-emerald-500/5 p-3">
          <p className="text-xs font-medium text-emerald-600 mb-1">
            Share Link
          </p>
          <code className="text-xs text-muted-foreground break-all">
            {typeof window !== "undefined"
              ? `${window.location.origin}/f/${form.slug}`
              : `/f/${form.slug}`}
          </code>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <Save className="h-3.5 w-3.5 mr-1.5" />
        )}
        Save Settings
      </Button>
    </div>
  );
}
