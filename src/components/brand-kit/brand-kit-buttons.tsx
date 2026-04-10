"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandKitSection } from "./brand-kit-section";
import { useBrandKitSection } from "@/hooks/use-brand-kit-section";
import { BUTTON_KEYS, FONT_WEIGHT_OPTIONS } from "@/lib/brand-kit-settings";
import { Plus, Trash2, ArrowRight } from "lucide-react";

export function BrandKitButtons() {
  const { settings, set, save, saving, loading } =
    useBrandKitSection(BUTTON_KEYS);

  const btnRadius = settings.brandButtonRadius || "8";
  const btnWeight = settings.brandButtonFontWeight || "500";
  const btnTransform = settings.brandButtonTransform || "none";

  // Get brand color for preview (from all settings which includes non-button keys)
  const brandColor = settings.brandAccentColor || "#e22726";

  return (
    <BrandKitSection
      title="Buttons"
      description="Customize how buttons look and feel across the entire system."
      saving={saving}
      loading={loading}
      onSave={save}
    >
      <div className="space-y-6">
        {/* Controls */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Button Style</CardTitle>
            <CardDescription>
              Configure border radius, font weight, and text transform for all buttons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <Label>Border Radius</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Slider
                    value={[Number(btnRadius)]}
                    onValueChange={(v) =>
                      set(
                        "brandButtonRadius",
                        String(Array.isArray(v) ? v[0] : v)
                      )
                    }
                    min={0}
                    max={24}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-muted-foreground w-10 text-right">
                    {btnRadius}px
                  </span>
                </div>
              </div>
              <div>
                <Label>Font Weight</Label>
                <Select
                  value={btnWeight}
                  onValueChange={(val) =>
                    set("brandButtonFontWeight", val ?? "500")
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_WEIGHT_OPTIONS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Text Transform</Label>
                <Select
                  value={btnTransform}
                  onValueChange={(val) =>
                    set("brandButtonTransform", val ?? "none")
                  }
                >
                  <SelectTrigger className="mt-2">
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
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              See how your button styles look in context.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-8">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-white transition-colors"
                  style={{
                    backgroundColor: brandColor,
                    borderRadius: `${btnRadius}px`,
                    fontWeight: btnWeight,
                    textTransform:
                      btnTransform as React.CSSProperties["textTransform"],
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Primary
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border transition-colors"
                  style={{
                    borderRadius: `${btnRadius}px`,
                    fontWeight: btnWeight,
                    borderColor: "var(--color-border)",
                    color: "var(--color-foreground)",
                    textTransform:
                      btnTransform as React.CSSProperties["textTransform"],
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
                    borderRadius: `${btnRadius}px`,
                    fontWeight: btnWeight,
                    textTransform:
                      btnTransform as React.CSSProperties["textTransform"],
                  }}
                >
                  Secondary
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm transition-colors hover:bg-muted/50"
                  style={{
                    borderRadius: `${btnRadius}px`,
                    fontWeight: btnWeight,
                    color: "var(--color-foreground)",
                    textTransform:
                      btnTransform as React.CSSProperties["textTransform"],
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
                    borderRadius: `${btnRadius}px`,
                    fontWeight: btnWeight,
                    textTransform:
                      btnTransform as React.CSSProperties["textTransform"],
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Destructive
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm underline underline-offset-4 transition-colors"
                  style={{
                    color: brandColor,
                    fontWeight: btnWeight,
                    textTransform:
                      btnTransform as React.CSSProperties["textTransform"],
                  }}
                >
                  Link <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BrandKitSection>
  );
}
