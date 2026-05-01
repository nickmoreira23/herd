"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import type { FormRow } from "./types";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

interface FormSettingsProps {
  form: FormRow;
  onUpdate: (updated: FormRow) => void;
}

export function FormSettings({
  form,
  onUpdate,
}: FormSettingsProps) {
  const t = useT();
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
      notifyError("error.forms.name_required", t);
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

      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        notifySuccess("forms.feedback.settings_saved", t);
        onUpdate({ ...form, ...json.data });
      } else {
        notifyError("error.forms.update_failed", t);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs">{t("forms.settings.name_label")}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">{t("forms.settings.description_label")}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder={t("forms.settings.description_placeholder")}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">{t("forms.settings.thank_you_label")}</Label>
        <Textarea
          value={thankYouMessage}
          onChange={(e) => setThankYouMessage(e.target.value)}
          rows={2}
          placeholder={t("forms.settings.thank_you_placeholder")}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">{t("forms.settings.access_mode_label")}</Label>
        <Select value={accessMode} onValueChange={(v) => setAccessMode(v ?? "PUBLIC")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">{t("forms.settings.access_mode.public")}</SelectItem>
            <SelectItem value="PRIVATE">{t("forms.settings.access_mode.private")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {accessMode === "PRIVATE" && (
        <div className="space-y-1.5">
          <Label className="text-xs">{t("forms.settings.access_password_label")}</Label>
          <Input
            type="password"
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            placeholder={t("forms.settings.access_password_placeholder")}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">{t("forms.settings.max_responses_label")}</Label>
        <Input
          type="number"
          value={maxResponses}
          onChange={(e) => setMaxResponses(e.target.value)}
          placeholder={t("forms.settings.max_responses_placeholder")}
          min={1}
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <Save className="h-3.5 w-3.5 mr-1.5" />
        )}
        {t("forms.settings.save_button")}
      </Button>
    </div>
  );
}
