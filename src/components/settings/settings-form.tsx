"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

const SETTING_FIELDS = [
  {
    key: "companyName",
    label: "Company Name",
    type: "text",
    group: "Branding",
  },
  {
    key: "brandAccentColor",
    label: "Brand Accent Color",
    type: "color",
    group: "Branding",
  },
  {
    key: "fulfillmentCostPerOrder",
    label: "Fulfillment Cost per Order ($)",
    type: "number",
    step: "0.5",
    group: "Operations",
  },
  {
    key: "shippingCostPerOrder",
    label: "Shipping Cost per Order ($)",
    type: "number",
    step: "0.5",
    group: "Operations",
  },
  {
    key: "marginFloorPercent",
    label: "Margin Floor (%)",
    type: "number",
    step: "1",
    group: "Financial Defaults",
  },
  {
    key: "defaultBreakageRate",
    label: "Default Breakage Rate (%)",
    type: "number",
    step: "1",
    group: "Financial Defaults",
  },
  {
    key: "defaultChurnRate",
    label: "Default Monthly Churn Rate (%)",
    type: "number",
    step: "0.5",
    group: "Financial Defaults",
  },
];

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleIconUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be under 2MB");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "branding");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const json = await uploadRes.json();
          toast.error(json.error || "Upload failed");
          return;
        }
        const { data } = await uploadRes.json();
        const iconUrl = data.url as string;

        // Save to settings
        const saveRes = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyIconUrl: iconUrl }),
        });
        if (!saveRes.ok) {
          toast.error("Failed to save icon setting");
          return;
        }

        setSettings((prev) => ({ ...prev, companyIconUrl: iconUrl }));
        toast.success("Company icon updated");
      } catch {
        toast.error("Something went wrong");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    []
  );

  const handleRemoveIcon = useCallback(async () => {
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyIconUrl: "" }),
      });
      setSettings((prev) => ({ ...prev, companyIconUrl: "" }));
      toast.success("Company icon removed");
    } catch {
      toast.error("Something went wrong");
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      toast.success("Settings saved");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  // Group fields
  const groups = SETTING_FIELDS.reduce(
    (acc, field) => {
      if (!acc[field.group]) acc[field.group] = [];
      acc[field.group].push(field);
      return acc;
    },
    {} as Record<string, typeof SETTING_FIELDS>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {Object.entries(groups).map(([group, fields]) => (
        <div key={group} className="rounded-lg border p-4 space-y-4">
          <h3 className="font-semibold">{group}</h3>
          <div className="grid grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key}>
                <Label className="text-sm">{field.label}</Label>
                {field.type === "color" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={settings[field.key] || "#FF0000"}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={settings[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                ) : (
                  <Input
                    type={field.type}
                    step={field.step}
                    value={settings[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Company Icon Upload — only in Branding group */}
          {group === "Branding" && (
            <div className="pt-2 border-t">
              <Label className="text-sm">Company Icon</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Displayed in the sidebar header. Recommended: square image, at least 64x64px.
              </p>
              <div className="flex items-center gap-4">
                {settings.companyIconUrl ? (
                  <div className="relative group/icon">
                    <Image
                      src={settings.companyIconUrl}
                      alt="Company icon"
                      width={48}
                      height={48}
                      className="rounded-lg object-contain border"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveIcon}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        {settings.companyIconUrl ? "Change Icon" : "Upload Icon"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
