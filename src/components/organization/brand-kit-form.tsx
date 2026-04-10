"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, X, Loader2, Plus, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface BrandKitFormProps {
  initialSettings: Record<string, string>;
}

const FONT_OPTIONS = [
  "Inter",
  "Nunito",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Source Sans 3",
  "DM Sans",
  "Plus Jakarta Sans",
  "Outfit",
  "Manrope",
  "Space Grotesk",
];

const FONT_WEIGHT_OPTIONS = [
  { value: "400", label: "Regular (400)" },
  { value: "500", label: "Medium (500)" },
  { value: "600", label: "Semibold (600)" },
  { value: "700", label: "Bold (700)" },
  { value: "800", label: "Extrabold (800)" },
];

interface ImageSlot {
  settingKey: string;
  label: string;
  description: string;
}

const IMAGE_SLOTS: ImageSlot[] = [
  {
    settingKey: "companyIconUrl",
    label: "Logo Icon",
    description: "Square icon used in the sidebar header. Min 64x64px.",
  },
  {
    settingKey: "companyLogoUrl",
    label: "Logo Horizontal",
    description: "Full logo mark used in login page and exports.",
  },
  {
    settingKey: "companyFaviconUrl",
    label: "Favicon",
    description: "Browser tab icon. Recommended 32x32px PNG.",
  },
  {
    settingKey: "companyAgentCircleUrl",
    label: "Agent Circle",
    description: "Circular avatar used for the AI assistant.",
  },
  {
    settingKey: "companyAgentFullUrl",
    label: "Agent Full Body",
    description: "Full body illustration of the AI assistant.",
  },
];

function generateShades(hex: string): { shade: number; color: string }[] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000].map((shade) => {
    const factor = shade <= 500 ? shade / 500 : 1;
    const darkFactor = shade > 500 ? (shade - 500) / 500 : 0;

    const nr = Math.round(255 - (255 - r) * factor - r * darkFactor * 0.7);
    const ng = Math.round(255 - (255 - g) * factor - g * darkFactor * 0.7);
    const nb = Math.round(255 - (255 - b) * factor - b * darkFactor * 0.7);

    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");

    return {
      shade,
      color: `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`,
    };
  });
}

export function BrandKitForm({ initialSettings }: BrandKitFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const set = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
      toast.success("Brand kit saved");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, settingKey: string) => {
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

      setUploadingKey(settingKey);
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
        const url = data.url as string;

        await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [settingKey]: url }),
        });

        set(settingKey, url);
        toast.success("Image uploaded");

        // Notify sidebar to refresh branding immediately
        if (settingKey === "companyIconUrl") {
          window.dispatchEvent(new CustomEvent("brand-kit-updated", { detail: { companyIconUrl: url } }));
        }
      } catch {
        toast.error("Something went wrong");
      } finally {
        setUploadingKey(null);
      }
    },
    [set]
  );

  const handleRemoveImage = useCallback(
    async (settingKey: string) => {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [settingKey]: "" }),
      });
      set(settingKey, "");
      toast.success("Image removed");

      if (settingKey === "companyIconUrl") {
        window.dispatchEvent(new CustomEvent("brand-kit-updated", { detail: { companyIconUrl: "" } }));
      }
    },
    [set]
  );

  const primaryColor = settings.brandAccentColor || "#e22726";
  const secondaryColor = settings.brandSecondaryColor || "#e22726";
  const primaryShades = generateShades(primaryColor);
  const secondaryShades = generateShades(secondaryColor);

  const borderRadius = settings.brandBorderRadius || "8";
  const btnBorderRadius = settings.brandButtonRadius || borderRadius;
  const btnFontWeight = settings.brandButtonFontWeight || "500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brand Kit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the fonts, colors, buttons, and images used throughout the system.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <Tabs defaultValue="light">
        <TabsList>
          <TabsTrigger value="light">Light</TabsTrigger>
          <TabsTrigger value="dark">Dark</TabsTrigger>
        </TabsList>

        <TabsContent value="light">
          <div className="space-y-6 pt-4">
            {/* Typography */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Typography</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>Primary Font</Label>
                    <Select
                      value={settings.brandPrimaryFont || "Inter"}
                      onValueChange={(val) => set("brandPrimaryFont", val ?? "Inter")}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for headings and UI labels.
                    </p>
                  </div>
                  <div>
                    <Label>Secondary Font</Label>
                    <Select
                      value={settings.brandSecondaryFont || "Nunito"}
                      onValueChange={(val) => set("brandSecondaryFont", val ?? "Nunito")}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for body text and descriptions.
                    </p>
                  </div>
                  <div>
                    <Label>Heading Weight</Label>
                    <Select
                      value={settings.brandHeadingWeight || "700"}
                      onValueChange={(val) => set("brandHeadingWeight", val ?? "700")}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHT_OPTIONS.map((w) => (
                          <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Font weight for headings.
                    </p>
                  </div>
                  <div>
                    <Label>Body Weight</Label>
                    <Select
                      value={settings.brandBodyWeight || "400"}
                      onValueChange={(val) => set("brandBodyWeight", val ?? "400")}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHT_OPTIONS.map((w) => (
                          <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Font weight for body text.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Primary */}
                <div>
                  <Label className="text-sm font-semibold">Primary</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => set("brandAccentColor", e.target.value)}
                      className="h-10 w-14 rounded border cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => set("brandAccentColor", e.target.value)}
                      className="w-32 font-mono text-sm"
                    />
                  </div>
                  <div className="flex mt-3 rounded-md overflow-hidden">
                    {primaryShades.map(({ shade, color }) => (
                      <div key={shade} className="flex-1 h-10" style={{ backgroundColor: color }} title={`${shade}: ${color}`} />
                    ))}
                  </div>
                  <div className="flex mt-1">
                    {primaryShades.map(({ shade, color }) => (
                      <div key={shade} className="flex-1 text-center">
                        <p className="text-[9px] text-muted-foreground">{shade}</p>
                        <p className="text-[8px] text-muted-foreground font-mono">{color}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secondary */}
                <div>
                  <Label className="text-sm font-semibold">Secondary</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => set("brandSecondaryColor", e.target.value)}
                      className="h-10 w-14 rounded border cursor-pointer"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => set("brandSecondaryColor", e.target.value)}
                      className="w-32 font-mono text-sm"
                    />
                  </div>
                  <div className="flex mt-3 rounded-md overflow-hidden">
                    {secondaryShades.map(({ shade, color }) => (
                      <div key={shade} className="flex-1 h-10" style={{ backgroundColor: color }} title={`${shade}: ${color}`} />
                    ))}
                  </div>
                  <div className="flex mt-1">
                    {secondaryShades.map(({ shade, color }) => (
                      <div key={shade} className="flex-1 text-center">
                        <p className="text-[9px] text-muted-foreground">{shade}</p>
                        <p className="text-[8px] text-muted-foreground font-mono">{color}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Success / Warning / Error */}
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { key: "brandSuccessColor", label: "Success", fallback: "#22c55e" },
                    { key: "brandWarningColor", label: "Warning", fallback: "#eab308" },
                    { key: "brandErrorColor", label: "Error", fallback: "#ef4444" },
                  ].map((item) => (
                    <div key={item.key}>
                      <Label className="text-sm font-semibold">{item.label}</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          type="color"
                          value={settings[item.key] || item.fallback}
                          onChange={(e) => set(item.key, e.target.value)}
                          className="h-10 w-14 rounded border cursor-pointer"
                        />
                        <Input
                          value={settings[item.key] || item.fallback}
                          onChange={(e) => set(item.key, e.target.value)}
                          className="w-32 font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Buttons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <Label>Border Radius</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Slider
                        value={[Number(btnBorderRadius)]}
                        onValueChange={(v) => set("brandButtonRadius", String(Array.isArray(v) ? v[0] : v))}
                        min={0}
                        max={24}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono text-muted-foreground w-10 text-right">{btnBorderRadius}px</span>
                    </div>
                  </div>
                  <div>
                    <Label>Font Weight</Label>
                    <Select
                      value={btnFontWeight}
                      onValueChange={(val) => set("brandButtonFontWeight", val ?? "500")}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHT_OPTIONS.map((w) => (
                          <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Text Transform</Label>
                    <Select
                      value={settings.brandButtonTransform || "none"}
                      onValueChange={(val) => set("brandButtonTransform", val ?? "none")}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="uppercase">UPPERCASE</SelectItem>
                        <SelectItem value="capitalize">Capitalize</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Live Preview */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Preview</Label>
                  <div className="rounded-lg border bg-muted/30 p-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-white transition-colors"
                        style={{
                          backgroundColor: primaryColor,
                          borderRadius: `${btnBorderRadius}px`,
                          fontWeight: btnFontWeight,
                          textTransform: (settings.brandButtonTransform || "none") as React.CSSProperties["textTransform"],
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Primary
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border transition-colors"
                        style={{
                          borderRadius: `${btnBorderRadius}px`,
                          fontWeight: btnFontWeight,
                          borderColor: "var(--color-border)",
                          color: "var(--color-foreground)",
                          textTransform: (settings.brandButtonTransform || "none") as React.CSSProperties["textTransform"],
                        }}
                      >
                        Outline
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm transition-colors"
                        style={{
                          backgroundColor: "var(--color-secondary)",
                          color: "var(--color-secondary-foreground)",
                          borderRadius: `${btnBorderRadius}px`,
                          fontWeight: btnFontWeight,
                          textTransform: (settings.brandButtonTransform || "none") as React.CSSProperties["textTransform"],
                        }}
                      >
                        Secondary
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm transition-colors hover:bg-muted/50"
                        style={{
                          borderRadius: `${btnBorderRadius}px`,
                          fontWeight: btnFontWeight,
                          color: "var(--color-foreground)",
                          textTransform: (settings.brandButtonTransform || "none") as React.CSSProperties["textTransform"],
                        }}
                      >
                        Ghost
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm transition-colors"
                        style={{
                          backgroundColor: "rgba(239,68,68,0.1)",
                          color: "#ef4444",
                          borderRadius: `${btnBorderRadius}px`,
                          fontWeight: btnFontWeight,
                          textTransform: (settings.brandButtonTransform || "none") as React.CSSProperties["textTransform"],
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Destructive
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm underline underline-offset-4 transition-colors"
                        style={{
                          color: primaryColor,
                          fontWeight: btnFontWeight,
                          textTransform: (settings.brandButtonTransform || "none") as React.CSSProperties["textTransform"],
                        }}
                      >
                        Link <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>Global Border Radius</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Slider
                        value={[Number(borderRadius)]}
                        onValueChange={(v) => set("brandBorderRadius", String(Array.isArray(v) ? v[0] : v))}
                        min={0}
                        max={24}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono text-muted-foreground w-10 text-right">{borderRadius}px</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Default radius for cards, inputs, and other UI elements.
                    </p>
                    {/* Radius preview */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="h-12 w-12 border-2 border-muted-foreground/30" style={{ borderRadius: `${borderRadius}px` }} />
                      <div className="h-12 w-20 border-2 border-muted-foreground/30" style={{ borderRadius: `${borderRadius}px` }} />
                      <div className="h-8 w-32 border-2 border-muted-foreground/30" style={{ borderRadius: `${borderRadius}px` }} />
                    </div>
                  </div>
                  <div>
                    <Label>Shadow Intensity</Label>
                    <Select
                      value={settings.brandShadowIntensity || "medium"}
                      onValueChange={(val) => set("brandShadowIntensity", val ?? "medium")}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="subtle">Subtle</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="strong">Strong</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Controls drop shadow depth on cards and modals.
                    </p>
                    {/* Shadow preview */}
                    <div className="flex items-center gap-4 mt-3">
                      {[
                        { label: "Card", shadow: { none: "none", subtle: "0 1px 2px rgba(0,0,0,0.05)", medium: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)", strong: "0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)" }[settings.brandShadowIntensity || "medium"] },
                        { label: "Modal", shadow: { none: "none", subtle: "0 2px 4px rgba(0,0,0,0.05)", medium: "0 4px 12px rgba(0,0,0,0.1)", strong: "0 10px 25px rgba(0,0,0,0.15)" }[settings.brandShadowIntensity || "medium"] },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="h-14 w-24 rounded-lg border bg-card flex items-center justify-center"
                          style={{ boxShadow: item.shadow, borderRadius: `${borderRadius}px` }}
                        >
                          <span className="text-[10px] text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>Content Density</Label>
                    <Select
                      value={settings.brandContentDensity || "comfortable"}
                      onValueChange={(val) => set("brandContentDensity", val ?? "comfortable")}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Controls spacing between elements throughout the system.
                    </p>
                  </div>
                  <div>
                    <Label>Animation Speed</Label>
                    <Select
                      value={settings.brandAnimationSpeed || "normal"}
                      onValueChange={(val) => set("brandAnimationSpeed", val ?? "normal")}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Disabled</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="slow">Relaxed</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Transition speed for hover effects, modals, and page transitions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {IMAGE_SLOTS.map((slot) => (
                    <div key={slot.settingKey}>
                      <Label className="text-sm">{slot.label}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-3">{slot.description}</p>
                      <div className="flex items-center gap-4">
                        {settings[slot.settingKey] ? (
                          <div className="relative group/img">
                            <Image
                              src={settings[slot.settingKey]}
                              alt={slot.label}
                              width={48}
                              height={48}
                              className="rounded-lg object-contain border h-12 w-12"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(slot.settingKey)}
                              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
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
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, slot.settingKey)}
                            className="hidden"
                            id={`upload-${slot.settingKey}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`upload-${slot.settingKey}`)?.click()}
                            disabled={uploadingKey === slot.settingKey}
                          >
                            {uploadingKey === slot.settingKey ? (
                              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading...</>
                            ) : (
                              "Upload Image"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dark">
          <div className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dark Mode Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Override colors for dark mode. Defaults to light mode values if not set.
                </p>
                {[
                  { key: "brandDarkPrimaryColor", label: "Primary (Dark)", fallback: primaryColor },
                  { key: "brandDarkSecondaryColor", label: "Secondary (Dark)", fallback: secondaryColor },
                  { key: "brandDarkBgColor", label: "Background", fallback: "#0a0a0a" },
                  { key: "brandDarkSurfaceColor", label: "Surface", fallback: "#171717" },
                ].map((item) => (
                  <div key={item.key}>
                    <Label className="text-sm font-semibold">{item.label}</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="color"
                        value={settings[item.key] || item.fallback}
                        onChange={(e) => set(item.key, e.target.value)}
                        className="h-10 w-14 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings[item.key] || item.fallback}
                        onChange={(e) => set(item.key, e.target.value)}
                        className="w-32 font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dark Mode Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Optionally upload alternate logos for dark backgrounds. Falls back to light mode images.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { settingKey: "companyDarkIconUrl", label: "Logo Icon (Dark)" },
                    { settingKey: "companyDarkLogoUrl", label: "Logo Horizontal (Dark)" },
                  ].map((slot) => (
                    <div key={slot.settingKey}>
                      <Label className="text-sm">{slot.label}</Label>
                      <div className="flex items-center gap-4 mt-2">
                        {settings[slot.settingKey] ? (
                          <div className="relative group/img">
                            <Image
                              src={settings[slot.settingKey]}
                              alt={slot.label}
                              width={48}
                              height={48}
                              className="rounded-lg object-contain border h-12 w-12 bg-zinc-900"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(slot.settingKey)}
                              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-zinc-900">
                            <Upload className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, slot.settingKey)}
                            className="hidden"
                            id={`upload-${slot.settingKey}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`upload-${slot.settingKey}`)?.click()}
                            disabled={uploadingKey === slot.settingKey}
                          >
                            {uploadingKey === slot.settingKey ? (
                              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading...</>
                            ) : (
                              "Upload Image"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
